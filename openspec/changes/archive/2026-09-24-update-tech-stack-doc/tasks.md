# Tasks

## 1. Rewrite tech-stack.md

- [x] 1.1 Replace the contents of `design-docs/tech-stack.md` with the title, a status legend (In use / Planned / To decide), and one `Technology | Purpose | Status` table for each section: Frontend, API, Database, Platform & Tooling, Platform Capabilities. Verify that all five section headings and the legend are present.
- [x] 1.2 Fill the Frontend table (Astro SSR, Astro Actions, @astrojs/cloudflare, TypeScript, Vite, Tailwind CSS 4 + typography, DaisyUI; all In use). Verify each row against `astro-web-platform/package.json` and `astro.config.mjs`.
- [x] 1.3 Fill the API table (Rust and workers-rs + worker-build as In use (scaffold); GraphQL library To decide: async-graphql, juniper). Verify against `tenants-graphql-api/Cargo.toml` and `wrangler.toml`.
- [x] 1.4 Fill the Database table (Drizzle ORM + drizzle-kit, drizzle-seed + tsx, Parcel as In use; Turso as "In use, being replaced by D1"; Cloudflare D1 as Planned, shared by both Workers via bindings). Verify against `tenants-db-lib/package.json` and `drizzle.config.ts`.
- [x] 1.5 Fill the Platform & Tooling table (Cloudflare Workers, Wrangler, Node.js 22 as In use; package manager, testing, CI/CD as To decide with candidates). Verify that the Node version matches `astro-web-platform/wrangler.toml`.
- [x] 1.6 Fill the Platform Capabilities table (authentication, authorization, payments, analytics; all To decide with candidates). Verify that each README feature (user, subscription tier, payment and analytics management) maps to a row.
- [x] 1.7 Add the Notes section on D1 multi-tenancy (one shared database scoped by `tenant_id`, because bindings are fixed in `wrangler.toml`) and D1 limits (size cap, one writer at a time). Verify that both notes are present.
- [x] 1.8 Confirm that no exact package versions appear, except the major versions that define a setup (Tailwind 4, Node.js 22), and that the README's "Tech Stack" link still resolves to the file.
