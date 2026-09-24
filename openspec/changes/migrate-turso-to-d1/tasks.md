# Tasks

## 1. Provision D1 and bindings

- [ ] 1.1 Run `wrangler login` and look up the `database_id` of the existing `tenants-db` D1 database (Cloudflare dashboard → Storage & Databases → D1, or `wrangler d1 list`). Don't create a database. Verify: `wrangler d1 list` shows `tenants-db` with that ID.
- [ ] 1.2 In `astro-web-platform/wrangler.toml`, add `[[d1_databases]]` (`binding = "DB"`, `database_name = "tenants-db"`, `database_id`, `migrations_dir = "../tenants-db-lib/migrations"`) at the top level and in `[env.development]` and `[env.production]`, with a comment that bindings aren't inherited. Remove `ASTRO_DB_REMOTE_URL`. Verify: `npx wrangler types` in `astro-web-platform` generates `worker-configuration.d.ts` with `DB: D1Database`.
- [ ] 1.3 Add a `cf-typegen` script (`wrangler types`) to `astro-web-platform/package.json`, and include the generated `worker-configuration.d.ts` in the Astro TypeScript setup. Verify: `npx astro check` reports no errors about `env.DB` once group 3 lands.
- [ ] 1.4 In `tenants-graphql-api/wrangler.toml`, add the same `[[d1_databases]]` binding `DB` (no `migrations_dir`). Verify: `npx wrangler types --config tenants-graphql-api/wrangler.toml` (or `wrangler deploy --dry-run` from that folder) accepts the config and lists the `DB` binding.

## 2. Migrations and seed for D1

- [ ] 2.1 Change `tenants-db-lib/drizzle.config.ts` to `dialect: "sqlite"` with only `schema` and `out` (no credentials, no dotenv). Verify: `npx drizzle-kit generate` runs without any env vars set.
- [ ] 2.2 Delete `migrations/0000_swift_tarantula.sql`, `migrations/0001_tired_skullbuster.sql` and `migrations/meta/`, then run `npm run db:generate` to produce one baseline migration. Verify: `migrations/` contains exactly one `.sql` file with `CREATE TABLE \`tenants\`` and columns matching `db/schema.ts`.
- [ ] 2.3 Replace `db/seed.ts` with `db/seed.sql`, which inserts the two sample tenants with fixed IDs using `INSERT OR IGNORE`. Verify: the file runs twice in a row against local D1 in task 2.5 without errors.
- [ ] 2.4 Add `db:migrate:local`, `db:migrate:remote`, `db:seed:local` and `db:seed:remote` scripts to `astro-web-platform/package.json` (`wrangler d1 migrations apply tenants-db --local|--remote`, `wrangler d1 execute tenants-db --local|--remote --file ../tenants-db-lib/db/seed.sql`). Remove `db:push`, `db:migrate`, `db:studio`, `db:seed`, `db:reset` and `turso:local` from `tenants-db-lib/package.json`. Verify: the scripts appear in each `package.json` as described.
- [ ] 2.5 Run `db:migrate:local`, then `db:seed:local` twice. Verify: `npx wrangler d1 execute tenants-db --local --command "SELECT COUNT(*) FROM tenants"` returns 2.
- [ ] 2.6 Update the README "Development" section: replace the Turso CLI steps with looking up the existing D1 database's `database_id`, `db:generate` (in `tenants-db-lib`) and the migrate/seed scripts (in `astro-web-platform`). Verify: no `turso` commands remain in `README.md`.

## 3. tenants-db-lib and Astro on the D1 binding

- [ ] 3.1 In `tenants-db-lib`, remove `@libsql/client`, `dotenv`, `drizzle-seed` and `tsx`; add `@cloudflare/workers-types` as a dev dependency and add it to `tsconfig.json` `types`. Verify: `npm install` succeeds and `grep -r libsql src db` returns nothing.
- [ ] 3.2 Create `src/tenants-store.ts` with a `TenantsStore` class that takes `DrizzleD1Database` and has `getTenants` and `getTenantByID` (both returning `TenantEntity`) and `deleteTenant`, which awaits the delete. Verify: `npx tsc --noEmit` passes in `tenants-db-lib`.
- [ ] 3.3 Change `src/main.ts` so the default export is `(db: AnyD1Database) => DataStores`, wrapping the binding with `drizzle(db)` from `drizzle-orm/d1`, and add a `tenants()` method that returns `new TenantsStore(this.#db)`. Verify: `npm run build` produces `build/bundle.js` and `build/bundle.d.ts` without type errors, and `bundle.d.ts` doesn't import `@libsql/client`.
- [ ] 3.4 In `astro-web-platform`, update `src/components/grids/TenantsGrid.astro` and `src/actions/tenants-actions.ts` to call `tenant_db_lib(env.DB)` with `import { env } from "cloudflare:workers"`. Verify: `npx astro check` passes.
- [ ] 3.5 Reinstall the local `tenants-db-lib` dependency in `astro-web-platform` and run `npm run dev` with the seeded local D1. Verify: the tenants grid shows the two seeded tenants, and opening a tenant's details (the `getTenant` action) shows its fields. Deleting a tenant from the grid removes it, and `npx wrangler d1 execute tenants-db --local --command "SELECT COUNT(*) FROM tenants"` returns 1; then re-run `db:seed:local`.
- [ ] 3.6 Update the Database rows in `design-docs/tech-stack.md`: Cloudflare D1 → In use, Turso row removed, `@libsql/client` gone. Verify: `grep -i turso design-docs/tech-stack.md` returns nothing.

## 4. Remote deploy

- [ ] 4.1 Rewrite `design-docs/deployment.md`: install `wrangler` (not `@cloudflare/wrangler`), look up the existing D1 database's `database_id`, run `db:migrate:remote` and `db:seed:remote`, then build and deploy, in that order. Verify: the doc has no `@cloudflare/wrangler` or Turso references.
- [ ] 4.2 Following `deployment.md`, apply the migration and seed remotely, then `npm run build && npm run deploy` in `astro-web-platform`. Verify: the deployed tenants page lists the two seeded tenants, and `npx wrangler d1 execute tenants-db --remote --command "SELECT COUNT(*) FROM tenants"` returns 2.
- [ ] 4.3 Check that no Turso references remain in the code or configs. Verify: `grep -rniE "turso|libsql" --exclude-dir=node_modules --exclude-dir=openspec .` returns nothing outside git history. (The Turso database itself is deleted by hand after this change is confirmed.)
