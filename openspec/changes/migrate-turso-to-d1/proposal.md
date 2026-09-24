# Proposal

## Why

`design-docs/tech-stack.md` marks Cloudflare D1 as the planned database, replacing Turso. Both apps already run on Cloudflare Workers. With D1 they reach the database through a Worker binding instead of a network URL and auth token, and the Astro app and the Rust GraphQL API can share one database without any extra credentials. Moving now, while the only data is seed data and the Rust API is still a scaffold, keeps the migration small.

PR #11 removed the placeholder stores from `tenants-db-lib`, so `astro-web-platform` no longer builds: it still calls `data_stores.tenants()`. This change adds a new D1-backed tenants store to fix that.

## What Changes

- **BREAKING (internal API):** `tenants-db-lib`'s default export takes a D1 database binding (`DataStores(db)`) instead of reading `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `process.env`. `DataStores` gets a `tenants()` accessor that returns a new `TenantsStore` (`getTenants`, `getTenantByID`, `deleteTenant`) built on Drizzle's D1 driver.
- Remove `@libsql/client` from `tenants-db-lib`, and remove Turso settings from `drizzle.config.ts`, the seed script and the npm scripts (`turso:local`).
- Replace Drizzle migrations `0000`/`0001` with one baseline migration generated for D1, and apply migrations with Wrangler (`wrangler d1 migrations apply`).
- Rewrite the seed as a D1 seed: a SQL seed file run with `wrangler d1 execute`, locally and remotely.
- Declare the existing D1 database `tenants-db` as a `[[d1_databases]]` binding in `astro-web-platform/wrangler.toml`. The database already exists in the Cloudflare account, and this change doesn't create it. Remove `ASTRO_DB_REMOTE_URL`.
- Astro callers (`TenantsGrid.astro`, `tenants-actions.ts`) pass the binding from `cloudflare:workers` into `tenants-db-lib`.
- Declare the same D1 binding in `tenants-graphql-api/wrangler.toml`. There is no Rust query code in this change.
- Existing Turso data is **not** migrated. D1 starts empty and is seeded.
- Update docs: the Turso steps in `README.md`, `design-docs/deployment.md` (including the deprecated `@cloudflare/wrangler` install), and the Database rows in `design-docs/tech-stack.md` (D1 → In use, Turso removed).

## Capabilities

### New Capabilities

None. This change swaps the storage backend and how it's accessed; tenant listing and viewing work as they did before PR #11, and deleting a tenant now takes effect. The change sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- **Code:** `tenants-db-lib` (`src/main.ts`, `src/tenants-store.ts` (new), `db/seed.ts`, `drizzle.config.ts`, `migrations/`, `package.json`); `astro-web-platform` (`wrangler.toml`, `src/components/grids/TenantsGrid.astro`, `src/actions/tenants-actions.ts`, `package.json`); `tenants-graphql-api/wrangler.toml`.
- **Dependencies:** remove `@libsql/client`; add `@cloudflare/workers-types` (dev) to `tenants-db-lib`.
- **Infrastructure:** uses the existing D1 database `tenants-db`; no new resources are created. The Turso database `tenants-db` is no longer used and can be deleted separately after the move.
- **Local dev:** `turso dev` is replaced by Wrangler's local D1 (used by `astro dev` on workerd and by `wrangler dev`).
- **Delete behavior:** the old `deleteTenant` built a delete query but never ran it. The new store awaits the delete. Adding and editing tenants, and the users and products stores, stay out of scope.
