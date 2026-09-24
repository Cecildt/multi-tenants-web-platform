# Tasks

## 1. Prerequisites and API project setup

- [ ] 1.1 Confirm the open manual tasks of `migrate-turso-to-d1` are done (1.1 real `database_id` in both `wrangler.toml` files; 2.5 local migrate and seed). Verify: `grep DATABASE_ID tenants-graphql-api/wrangler.toml` returns nothing.
- [ ] 1.2 Add dependencies to `tenants-graphql-api/Cargo.toml`: enable the `d1` feature on `worker`, and add `async-graphql` (`default-features = false`), `serde` (`derive`), `serde_json`, and `uuid` (`v4`, `js`). Verify: `cargo build --target wasm32-unknown-unknown --release` succeeds.
- [ ] 1.3 Create `tenants-graphql-api/package.json` (private, `wrangler` dev dependency) with `dev`, `deploy`, `db:migrate:local|remote`, and `db:seed:local|remote` (`--file ../tenants-db-lib/db/seed.sql`). Add `migrations_dir = "../tenants-db-lib/migrations"`, `workers_dev = false`, and `preview_urls = false` to `tenants-graphql-api/wrangler.toml`. Verify: `npm install`, then `npm run db:migrate:local` and `npm run db:seed:local`, then `npx wrangler d1 execute tenants-db --local --command "SELECT COUNT(*) FROM tenants"` returns 2 from inside `tenants-graphql-api`.

## 2. GraphQL API: reads

- [ ] 2.1 Add a worker-independent module with the timestamp conversion (`YYYY-MM-DD HH:MM:SS` → `YYYY-MM-DDTHH:MM:SSZ`, pass-through otherwise) and input validation and normalization (trim, lowercase `tenantName`, 3-character minimum, email check). Include `#[cfg(test)]` unit tests for every rule in the spec's "Input validation" and "Tenant type" requirements. Verify: `cargo test` passes.
- [ ] 2.2 Add `src/errors.rs` mapping validation errors to `BAD_USER_INPUT` with `extensions.field`, and D1 errors to `INTERNAL_SERVER_ERROR` with a generic message, logging the original with `console_error!`. Verify: unit test checks the mapped error has no SQL text in its message.
- [ ] 2.3 Add `src/tenants.rs` (row struct, row→`Tenant` mapping, `SendWrapper`/`SendFuture` D1 helper) and `src/schema.rs` with the `Tenant` type and the `tenants` and `tenant(tenantId)` queries. Verify: `cargo build --target wasm32-unknown-unknown --release` succeeds.
- [ ] 2.4 Replace the stub in `src/lib.rs` with routing: `POST /graphql` executes, other methods return 405, other paths return 404, and bad JSON returns 400 with `errors`. Verify with `npm run dev` and curl: `{ tenants { tenantId createdAt } }` returns the 2 seed tenants with `...T...Z` timestamps; `tenant(tenantId:"does-not-exist")` returns `null`; `GET /graphql` returns 405; `GET /` returns 404.

## 3. GraphQL API: mutations

- [ ] 3.1 Add `createTenant` (UUID v4 ID, `INSERT … RETURNING *`) and `updateTenant` (`UPDATE … SET …, updated_timestamp = CURRENT_TIMESTAMP … RETURNING *`, `null` when no row), both running validation first. Verify with curl against `npm run dev`: create returns a new ID that `tenant` then finds; two identical creates return different IDs; `tenantName: " ab "` returns `BAD_USER_INPUT`/`tenantName` and the count is unchanged; updating `tenant_john_001` keeps `createdAt`; updating an unknown ID returns `null`.
- [ ] 3.2 Add `deleteTenant` (`DELETE … RETURNING tenant_id`, returns `true` or `false`). Verify with curl: deleting a created tenant returns `true` and deleting it again returns `false`; then re-run `npm run db:seed:local`.
- [ ] 3.3 Replace the REST endpoint list in `design-docs/api-documentation.md` with the GraphQL schema (types, queries, mutations, error codes) and a curl example. Set the async-graphql row in `design-docs/tech-stack.md` to In use. Verify: the curl example in the doc runs as written against `npm run dev`.

## 4. Astro: GraphQL client and connection

- [ ] 4.1 In `astro-web-platform/wrangler.toml`, replace all three `[[d1_databases]]` blocks with `[[services]] binding = "TENANTS_API", service = "tenants-graphql-api"` (top level, `env.development`, `env.production`). Add `.dev.vars.example` with `GRAPHQL_API_URL=http://localhost:8787/graphql`. Run `npm run cf-typegen`. Verify: `worker-configuration.d.ts` has `TENANTS_API: Fetcher` and no `DB`.
- [ ] 4.2 Create `src/lib/tenants-api.ts` with `gql()` (binding first, then `GRAPHQL_API_URL`, else throw naming both), `TenantsApiError`, a `Tenant` type, and `listTenants`, `getTenant`, `createTenant`, `updateTenant`, and `deleteTenant`. Verify: `npx astro check` passes.

## 5. Astro: move callers to the API

- [ ] 5.1 Rewrite `TenantsGrid.astro` frontmatter to use `listTenants()` in a `try/catch`, render `createdAt`/`updatedAt` strings, and show a daisyUI `alert-error` on failure. Verify: with the API running (`npm run dev` in `tenants-graphql-api`) and `.dev.vars` set, `/` lists the 2 seed tenants; with the API stopped, `/` renders the error alert.
- [ ] 5.2 Rewrite `tenants-actions.ts`: `getTenant` and `deleteTenant` call the API. `addTenant` and `editTenant` call `createTenant` and `updateTenant`, return the API's `tenant_id`, and map `BAD_USER_INPUT` to `ActionError("BAD_REQUEST")` with the camelCase→snake_case field map. Remove the `nanoid` and `tenants-db-lib` imports. Verify in the browser: Details shows the tenant's fields, create redirects to `/?tenant_id=<uuid>` and the grid lists it, and delete then reload removes it.
- [ ] 5.3 In `src/pages/tenants/[tenant_id].astro`, load the tenant with `getTenant` on GET to prefill the form (submitted values still win after a failed POST), and return 404 for an unknown ID. Verify: `/tenants/tenant_john_001` is prefilled, saving a new email redirects and the grid shows it with a later updated date, and `curl -I localhost:4321/tenants/does-not-exist` returns 404.
- [ ] 5.4 Remove `tenants-db-lib`, `nanoid`, and `dotenv` from `astro-web-platform/package.json`, and remove its `db:migrate:*`/`db:seed:*` scripts. Reinstall. Verify: `npm run build` succeeds, and `grep -rnE "tenants-db-lib|env\.DB|d1_databases" astro-web-platform --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro` returns nothing (lock file entries gone after reinstall).
- [ ] 5.5 Update the README "Development" section (run `npm run dev` in `tenants-graphql-api`, copy `.dev.vars.example` to `.dev.vars`, then `npm run dev` in `astro-web-platform`; the migrate and seed scripts now live in `tenants-graphql-api`) and `design-docs/deployment.md` (migrate, seed, and deploy from `tenants-graphql-api` first, then deploy Astro). Verify: following the README from a clean checkout brings up the grid with the seed tenants.

## 6. Integration check

- [ ] 6.1 Deploy following `deployment.md`: API first, then Astro. Verify: the deployed admin app lists tenants and create, edit, and delete work through the service binding; the API's `workers.dev` hostname doesn't serve the API; the API bundle size reported by `wrangler deploy` is under the plan limit.
