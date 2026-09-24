# Design

## Context

- `astro-web-platform` (Astro 7, `@astrojs/cloudflare`, `output: "server"`) reads tenants in two places: the frontmatter of `src/components/grids/TenantsGrid.astro` (`getTenants`), and `src/actions/tenants-actions.ts` (`getTenantByID`, `deleteTenant`). Both use `tenant_db_lib(env.DB)` with `env` from `cloudflare:workers`. `addTenant` and `editTenant` only log. The edit page (`src/pages/tenants/[tenant_id].astro`) never loads the tenant, so its form starts empty.
- `astro-web-platform/wrangler.toml` declares the D1 binding `DB` three times (top level, `env.development`, `env.production`) with `migrations_dir = "../tenants-db-lib/migrations"`, and `package.json` holds the `db:migrate:*` and `db:seed:*` scripts.
- `tenants-graphql-api` is a workers-rs 0.8 scaffold (`worker` with the `http` feature, built by `worker-build`). `src/lib.rs` returns an empty 200. `wrangler.toml` already declares the same `DB` binding and has no `env` blocks.
- The table schema is `tenants(tenant_id TEXT PK, tenant_name, business_name, email, created_timestamp TEXT DEFAULT CURRENT_TIMESTAMP, updated_timestamp …)`, from `tenants-db-lib/db/schema.ts` and the single D1 migration. D1 stores timestamps as `YYYY-MM-DD HH:MM:SS` in UTC.
- `migrate-turso-to-d1` is merged but still has open manual tasks: the real `database_id`, and local and remote migrate and seed.

## Goals / Non-Goals

**Goals:**
- One database owner: only `tenants-graphql-api` holds the D1 binding at runtime.
- The Astro to API call works the same way deployed (service binding) and locally (HTTP URL), behind one client module.
- Add and edit work end to end.

**Non-Goals:**
- Authentication between Astro and the API. This is mitigated by not exposing the API publicly (see Decisions).
- A generated GraphQL client, codegen, or caching. There are five operations, so hand-written documents and TypeScript types are enough.
- GraphiQL or a playground endpoint, subscriptions, and pagination.
- Changes to the Drizzle schema or migrations.

## Decisions

### 1. Rust API: `async-graphql` on workers-rs, raw D1 SQL
Use `async-graphql` with `default-features = false`, which is already chosen in `tech-stack.md`. It compiles to `wasm32-unknown-unknown`. Enable the `worker` crate's `d1` feature and write resolvers as prepared statements with `.bind()` (`SELECT … FROM tenants`, `INSERT … RETURNING *`, `UPDATE … RETURNING *`, `DELETE … RETURNING tenant_id`). `RETURNING` lets update and delete tell "not found" apart from success in one round trip, which the `null`/`false` results in the spec need.

*Alternatives:* `juniper`, which has weaker async and wasm support. An ORM such as `sea-orm`, which has no D1 driver.

**`Send` constraint:** `async-graphql` needs `Send + Sync` context data and `Send` resolver futures, but `worker::D1Database` wraps a `JsValue` and is `!Send`. Wrap the database in `worker::send::SendWrapper` when putting it in the schema context, and wrap resolver D1 futures in `worker::send::SendFuture`. This is safe because a Worker isolate is single-threaded. Build the `Schema` once per request (it's cheap) with the wrapped `D1Database` as data, since `env` comes per request.

**Module layout:** `src/lib.rs` (fetch handler and routing), `src/schema.rs` (Query, Mutation, input types), `src/tenants.rs` (row struct, row→`Tenant` mapping, SQL), `src/errors.rs` (maps errors to `BAD_USER_INPUT` and `INTERNAL_SERVER_ERROR`).

**Routing:** only `/graphql`. `POST` executes the request, other methods return 405, other paths return 404, and a JSON parse failure returns 400 with a GraphQL `errors` body. Parse with `serde_json` into `async_graphql::Request`, and don't use a framework integration crate. None of them target workers-rs 0.8.

### 2. IDs, timestamps, validation in the API
- **IDs:** `uuid::Uuid::new_v4()` (features `v4` and `js`, so `getrandom` uses `crypto.getRandomValues`). This replaces Astro's `nanoid`. `TEXT` IDs keep working, and the seed IDs (`tenant_john_001`) stay valid. *Alternative:* the `nanoid` crate, which uses the same `getrandom` route but is less standard. Neither format is exposed as a contract.
- **Timestamps:** keep the stored format and let `CURRENT_TIMESTAMP` defaults set `created_timestamp`. `updateTenant` sets `updated_timestamp = CURRENT_TIMESTAMP`. The row→`Tenant` mapping converts `YYYY-MM-DD HH:MM:SS` to `YYYY-MM-DDTHH:MM:SSZ` with a string rewrite, not a date library. If a value doesn't match that pattern, pass it through unchanged and log a warning.
- **Validation:** mirror the current Zod rules (trim, 3-character minimum, lowercase `tenantName`, email check). The API is the trust boundary, so it validates even though Astro validates too. For email, use a minimal `local@domain.tld` check with no whitespace and not a full RFC parser, which matches the permissiveness of `z.string().email()` closely enough.

### 3. Astro to API transport: service binding with URL fallback
`astro-web-platform/wrangler.toml`: drop every `[[d1_databases]]` block and add `[[services]] binding = "TENANTS_API", service = "tenants-graphql-api"` at the top level, in `env.development`, and in `env.production`, because bindings aren't inherited. `GRAPHQL_API_URL` goes in `.dev.vars` (git-ignored, with a committed `.dev.vars.example`) for local runs where the dev registry can't resolve the binding.

`src/lib/tenants-api.ts` (server-only):
```ts
async function gql<T>(query: string, variables?: object): Promise<T>
// env.TENANTS_API?.fetch("https://tenants-api/graphql", …) ?? fetch(env.GRAPHQL_API_URL, …)
```
The host in the service-binding URL is ignored by Cloudflare, but the API routes on the path. `gql` throws a `TenantsApiError` that carries the GraphQL `errors` array. The module exports `listTenants`, `getTenant`, `createTenant`, `updateTenant`, and `deleteTenant` with a `Tenant` TypeScript type that uses camelCase fields.

*Alternatives:* public HTTP only, which adds a public hop and needs the API to be public. Calling the API from the browser, which needs CORS and exposes the API. The user chose the service binding with a fallback.

### 4. Keep the Astro Action shapes and adapt at the edge
The actions keep their snake_case return shapes (`tenant_id`, `business_name`, `created_at`, …). `TenantsGrid.astro`, `TenantDeleteDialog.astro` and the forms then change very little. The actions map from the camelCase `Tenant`. Specifically:
- `addTenant` returns the API-generated `tenant_id`, so the existing redirect in `create.astro` keeps working.
- API `BAD_USER_INPUT` errors become `ActionError({ code: "BAD_REQUEST" })`. The forms already show `isInputError` field errors, and a server-side rejection becomes a message on the named field, with the API's `extensions.field` mapped to the form field.
- `TenantsGrid.astro` renders `createdAt` and `updatedAt` strings directly. The `.toISOString()` calls go away because they were `Date` methods from `TenantEntity`. A `try/catch` around `listTenants()` renders a daisyUI `alert-error` instead of throwing.
- `[tenant_id].astro` calls `getTenant` on GET to prefill the form and returns `new Response(null, { status: 404 })` when it gets `null`. After a failed POST, the submitted values still win.

### 5. Database ownership moves to the API project
Add `tenants-graphql-api/package.json` (private, `wrangler` dev dependency) with `dev` (`wrangler dev`), `deploy` (`wrangler deploy`), `db:migrate:local|remote` and `db:seed:local|remote`. Move `migrations_dir = "../tenants-db-lib/migrations"` into `tenants-graphql-api/wrangler.toml`. Local D1 state then lives under `tenants-graphql-api/.wrangler/`, which is the instance the API reads during `wrangler dev`. `tenants-db-lib` stays the schema and migration source (`db:generate`).

### 6. No public API in production
Set `workers_dev = false` and `preview_urls = false` in `tenants-graphql-api/wrangler.toml`, with no routes. Service bindings still work, and `wrangler dev` still serves on `localhost:8787`. This makes it safe to ship mutations without auth for now.

### 7. `tenants-db-lib` runtime exports are removed in a follow-up
After this change nothing imports `tenants-db-lib` at runtime. A separate follow-up change removes its `DataStores` and `TenantsStore` exports (`src/main.ts`, `src/tenants-store.ts`, `src/entities/`) and the build that ships them, so the package holds only the Drizzle schema, migrations, and seed. This change leaves those exports alone to keep it focused and easy to roll back: the previous Astro version still imports them (see Migration Plan).

## Risks / Trade-offs

- [The `SendWrapper` misuse compiles but could panic if a future is moved across threads] → Workers are single-threaded. Keep the wrapping in one helper in `tenants.rs` so it's easy to audit.
- [`async-graphql` pulls in a lot of code and grows the wasm bundle, which could approach the Worker size limit] → Use `default-features = false` and a `--release` build (already set up). Check the gzipped size in the build task, which should stay well under the 3 MB free-tier limit.
- [Two local processes are needed (`wrangler dev` for the API, `astro dev`)] → Document it in the README. The `GRAPHQL_API_URL` fallback means the binding doesn't have to resolve in dev.
- [Deploy order: Astro's deploy fails if `tenants-graphql-api` doesn't exist yet] → Document it in `deployment.md`: deploy the API first.
- [`BAD_USER_INPUT` field names (camelCase) differ from form field names (snake_case)] → Use one explicit map in `tenants-actions.ts`.
- [An extra network hop per page render] → A service binding is an in-datacenter call. The grid makes one query.
- [The seed stays a raw SQL file, so drift from future schema changes isn't caught] → No change from today.

## Migration Plan

1. Finish the open manual tasks from `migrate-turso-to-d1` (the `database_id`, and local and remote migrate and seed).
2. Build and deploy `tenants-graphql-api` (`npm run deploy` in that folder). Verify it with `wrangler tail` or a temporary local `wrangler dev` query.
3. Deploy `astro-web-platform` with the `TENANTS_API` binding.
4. **Rollback:** redeploy the previous Astro version (`wrangler rollback` in `astro-web-platform`). It still has the D1 binding and `tenants-db-lib`, and the data hasn't changed shape. The API can stay deployed.
