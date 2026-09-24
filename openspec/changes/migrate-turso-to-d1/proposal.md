# Proposal

## Why

`design-docs/tech-stack.md` marks Cloudflare D1 as the planned database, replacing Turso. Both apps already run on Cloudflare Workers. With D1 they reach the database through a Worker binding instead of a network URL and auth token, and the Astro app and the Rust GraphQL API can share one database without any extra credentials. Moving now, while the only data is seed data and the Rust API is still a scaffold, keeps the migration small.

## What Changes

- **BREAKING (internal API):** `tenants-db-lib`'s default export takes a D1 database binding (`DataStores(db)`) instead of reading `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `process.env`. The stores use Drizzle's D1 driver.
- Remove `@libsql/client` from `tenants-db-lib`, and remove Turso settings from `drizzle.config.ts`, the seed script and the npm scripts (`turso:local`).
- Replace Drizzle migrations `0000`/`0001` with one baseline migration generated for D1, and apply migrations with Wrangler (`wrangler d1 migrations apply`).
- Rewrite the seed as a D1 seed: a SQL seed file run with `wrangler d1 execute`, locally and remotely.
- Create a D1 database and declare it as a `[[d1_databases]]` binding in `astro-web-platform/wrangler.toml`. Remove `ASTRO_DB_REMOTE_URL`.
- Astro callers (`TenantsGrid.astro`, `tenants-actions.ts`) pass the binding from `cloudflare:workers` into `tenants-db-lib`.
- Declare the same D1 binding in `tenants-graphql-api/wrangler.toml`. There is no Rust query code in this change.
- Existing Turso data is **not** migrated. D1 starts empty and is seeded.
- Update docs: the Turso steps in `README.md`, `design-docs/deployment.md` (including the deprecated `@cloudflare/wrangler` install), and the Database rows in `design-docs/tech-stack.md` (D1 → In use, Turso removed).

## Capabilities

### New Capabilities

None. This change swaps the storage backend and how it's accessed; tenant listing and viewing work the same way. The change sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- **Code:** `tenants-db-lib` (`src/main.ts`, `src/tenants-store.ts`, `db/seed.ts`, `drizzle.config.ts`, `migrations/`, `package.json`); `astro-web-platform` (`wrangler.toml`, `src/components/grids/TenantsGrid.astro`, `src/actions/tenants-actions.ts`, `package.json`); `tenants-graphql-api/wrangler.toml`.
- **Dependencies:** remove `@libsql/client`; add `@cloudflare/workers-types` (dev) to `tenants-db-lib`.
- **Infrastructure:** a new D1 database in the Cloudflare account. The Turso database `tenants-db` is no longer used and can be deleted separately after the move.
- **Local dev:** `turso dev` is replaced by Wrangler's local D1 (used by `astro dev` on workerd and by `wrangler dev`).
- **Out of scope, found during planning:** `TenantsStore.deleteTenant` builds a delete query but never awaits or executes it, so deletes don't happen on either backend. This change doesn't fix it; it should be its own change.
