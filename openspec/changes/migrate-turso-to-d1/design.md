# Design

## Context

See proposal.md for why. Here is the current shape of the code:

```
astro-web-platform (Worker, Astro 7 SSR, workerd in dev)
  TenantsGrid.astro, tenants-actions.ts
        |  tenant_db_lib().tenants()  <-- no args; tenants() was removed in PR #11
        v
tenants-db-lib (Parcel bundle, file: dependency)
  DataStores(): createClient({ url: TURSO_DATABASE_URL, authToken })
  (no stores: tenants/products/users stores were removed in PR #11)
        |  libsql over network
        v
Turso "tenants-db"

tenants-graphql-api (Rust Worker scaffold, no DB access)
```

Constraints:
- D1 is reachable only through a Worker binding (or the Cloudflare REST API). There is no connection URL.
- Wrangler bindings are **non-inheritable**: a `[[d1_databases]]` entry at the top level of `wrangler.toml` doesn't apply inside `[env.development]` / `[env.production]`.
- The Astro Cloudflare adapter runs `astro dev` on workerd and exposes bindings through `import { env } from "cloudflare:workers"`.
- The only data in Turso is seed data (see proposal.md).

## Goals / Non-Goals

**Goals:**
- `tenants-db-lib` has no connection config of its own. The caller passes the D1 binding in.
- One D1 database, bound as `DB` in both Workers.
- Migrations and seed data work the same way locally (Miniflare) and remotely.

**Non-Goals:**
- Rust code that queries D1 (this change only adds the binding).
- Per-tenant databases.
- Users or products stores, or adding and editing tenants.
- Drizzle Studio / `drizzle-kit push` against remote D1.

## Decisions

### 1. `DataStores` takes the binding; typed as `AnyD1Database`

`tenants-db-lib` default export becomes `(db: AnyD1Database) => DataStores`, and `DataStores` wraps it with `drizzle(db)` from `drizzle-orm/d1`. `DataStores.tenants()` returns a `TenantsStore` built on the `DrizzleD1Database`.

- `AnyD1Database` is Drizzle's own type. It resolves to the global `D1Database` when `@cloudflare/workers-types` is loaded. The bundled `.d.ts` therefore doesn't import the workers-types package itself, and consumers can use either Wrangler-generated types or workers-types.
- *Alternative:* keep reading the binding inside the lib through `cloudflare:workers`. Rejected: it ties the library to the Workers runtime, and tests couldn't pass in a different database.

### 2. A new `TenantsStore` written for D1

`src/tenants-store.ts` holds a new `TenantsStore` that takes `DrizzleD1Database`:

- `getTenants(): Promise<TenantEntity[]>`
- `getTenantByID(tenant_id: string): Promise<TenantEntity | null>`
- `deleteTenant(tenant_id: string): Promise<void>`, which awaits the delete

Rows map to the existing `src/entities/tenant-entity.ts`. The signatures match what `TenantsGrid.astro` and `tenants-actions.ts` already call, so the callers only change how they create `DataStores`.

- *Alternative:* restore the old store from git and convert it. Rejected: it would bring back the empty add/edit stubs and the delete that never runs.

### 3. Astro gets the binding from `cloudflare:workers`

`TenantsGrid.astro` and `tenants-actions.ts` call `tenant_db_lib(env.DB)` with `import { env } from "cloudflare:workers"`. A `wrangler types` script generates `worker-configuration.d.ts` so `env.DB` is typed.

- *Alternative:* `Astro.locals.runtime.env`. That's the older adapter API; the adapter version in use is built around `cloudflare:workers`.

### 4. One D1 database, `tenants-db`, declared in every Wrangler scope

`tenants-db` already exists in the Cloudflare account. This change only refers to it by `database_id`. `astro-web-platform/wrangler.toml` declares `binding = "DB"`, `database_name`, `database_id`, and `migrations_dir = "../tenants-db-lib/migrations"` at the top level **and** in `[env.development]` and `[env.production]`, because bindings aren't inherited. Development and production share one database, which matches what the Turso setup did. `ASTRO_DB_REMOTE_URL` is removed. `tenants-graphql-api/wrangler.toml` gets the same `DB` binding at the top level (it has no env blocks).

- `database_id` isn't a secret and is committed.
- *Alternative:* separate dev and prod databases. Deferred: it's easy to add later by changing the IDs in each env block.

### 5. Astro owns D1 operations; Drizzle only generates SQL

- `drizzle.config.ts` → `dialect: "sqlite"`, `schema`, `out: "./migrations"`, with no credentials and no dotenv. `drizzle-kit generate` needs no database connection.
- `db:push`, `db:migrate`, `db:studio`, `db:seed`, `db:reset`, `turso:local` are removed from `tenants-db-lib`.
- `astro-web-platform/package.json` gets `db:migrate:local` / `db:migrate:remote` (`wrangler d1 migrations apply tenants-db --local|--remote`) and `db:seed:local` / `db:seed:remote` (`wrangler d1 execute tenants-db --file ../tenants-db-lib/db/seed.sql`). They run from the Astro package because it has Wrangler as a dependency and holds the binding config. Local D1 state therefore lands in `astro-web-platform/.wrangler/state`, the same place `astro dev` reads from.
- Wrangler reads only the `.sql` files in `migrations_dir`; Drizzle's `meta/` folder sits beside them and is ignored.

### 6. Squash migrations into one baseline

Delete `0000_swift_tarantula.sql`, `0001_tired_skullbuster.sql` and `meta/`, then run `drizzle-kit generate` to produce one fresh migration that creates `tenants` in its current shape. D1 starts empty, so there's no history to keep, and the squash drops `0001`'s `ADD COLUMN ... DEFAULT (CURRENT_TIMESTAMP)`, which SQLite rejects on tables that already have rows.

### 7. SQL seed file replaces `seed.ts`

`db/seed.sql` inserts the two sample tenants with fixed IDs. It uses `INSERT OR IGNORE` so re-running it is safe. `seed.ts`, `tsx`, `drizzle-seed` and `dotenv` are removed from `tenants-db-lib`.

- *Alternative:* keep a TS seed through `drizzle-orm/d1` with Wrangler's `getPlatformProxy`. Rejected: that's more machinery than two INSERT statements need.

## Risks / Trade-offs

- **The Rust API's local D1 is separate.** Running `wrangler dev` in `tenants-graphql-api` keeps its own `.wrangler/state`. → Document `--persist-to ../astro-web-platform/.wrangler/state` for anyone who needs shared local data. It doesn't matter yet because the API doesn't query D1.
- **Bindings must be repeated in each env block.** Easy to miss when adding an env. → Add a comment in `wrangler.toml` next to the env blocks.
- **The Parcel bundle's types need global `D1Database`.** → Astro gets it from the generated `worker-configuration.d.ts`; `tenants-db-lib` adds `@cloudflare/workers-types` as a dev dependency and to `tsconfig` `types` for its own build.
- **Deploys need the migration applied first.** A deploy before `db:migrate:remote` returns errors for missing tables. → The deployment doc lists migrate-then-deploy order.
- **D1 size and write limits** (see `design-docs/tech-stack.md` Notes). Fine for tenant-management data.

## Migration Plan

1. `wrangler login`, then look up the existing `tenants-db`'s `database_id` (Cloudflare dashboard → D1, or `wrangler d1 list`).
2. Land the code and config changes.
3. `db:migrate:remote`, then `db:seed:remote`.
4. `npm run build && npm run deploy` in `astro-web-platform`, then check that the tenants page lists the seeded tenants.
5. Rollback: redeploy the previous commit. Turso `tenants-db` stays untouched until this is confirmed, then is deleted by hand (outside this change).
