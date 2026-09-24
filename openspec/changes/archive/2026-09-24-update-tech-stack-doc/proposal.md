# Proposal

## Why

`design-docs/tech-stack.md` lists only seven frontend and database items. It omits the Rust GraphQL API, the Cloudflare Workers platform and tooling, and every open technology decision. It also doesn't record the decision to move database storage from Turso to Cloudflare D1. Readers of the design docs can't tell what the platform runs on today or what is still undecided.

## What Changes

- Rewrite `design-docs/tech-stack.md` as one table per layer (Frontend, API, Database, Platform & Tooling, Platform Capabilities) with columns **Technology | Purpose | Status**.
- Add a status legend: **In use**, **Planned**, **To decide**.
- Record technologies already in the repo that the doc omits: Astro SSR and Actions, `@astrojs/cloudflare`, Tailwind 4 via the Vite plugin, drizzle-kit/drizzle-seed, Parcel, Rust + workers-rs, Cloudflare Workers, Wrangler and Node 22.
- Mark **Cloudflare D1** as **Planned** database storage, shared by the Astro and Rust Workers through bindings. Keep **Turso** listed as *In use, being replaced by D1* until the code migration lands.
- List open choices as **To decide**, with candidate options: GraphQL library, package manager, testing, CI/CD, authentication, authorization, payments and analytics.
- Add a short Notes section on D1 and multi-tenancy (one shared database scoped by `tenant_id`) and D1 limits (size cap, one writer at a time).
- Omit exact versions; the package manifests remain the source of truth for them.

## Capabilities

### New Capabilities

None. This is a documentation-only change and changes no system behavior (`skip_specs: true`).

### Modified Capabilities

None.

## Impact

- **Files:** `design-docs/tech-stack.md` only.
- **Code, APIs, dependencies:** none. The actual Turso-to-D1 code migration is out of scope and will be a separate change (for example, `migrate-turso-to-d1`).
- **Related docs not touched here:** `design-docs/deployment.md` still shows the deprecated `@cloudflare/wrangler` install and Turso-era steps, and the README has Turso CLI instructions. Both should be updated with the D1 migration change.
