# Tech Stack

Status legend:

- **In use**: in the repo today
- **Planned**: decided, not yet implemented
- **To decide**: open decision, candidates listed

Exact versions are tracked in each package's manifest (`package.json`, `Cargo.toml`), not here.

## Frontend (`astro-web-platform`)

| Technology | Purpose | Status |
|---|---|---|
| Astro (SSR, `output: "server"`) | Admin web app framework | In use |
| Astro Actions | Form handling and server mutations | In use |
| @astrojs/cloudflare | Adapter to run Astro on Cloudflare Workers | In use |
| TypeScript | Language | In use |
| Vite | Build tooling (via Astro) | In use |
| Tailwind CSS 4 (`@tailwindcss/vite`, `@tailwindcss/typography`) | Styling | In use |
| DaisyUI | Component styles for Tailwind | In use |

## API (`tenants-graphql-api`)

| Technology | Purpose | Status |
|---|---|---|
| Rust | API language | In use (scaffold) |
| workers-rs (`worker` crate) + worker-build | Run Rust on Cloudflare Workers | In use (scaffold) |
| GraphQL library | Schema and resolvers | async-graphql | In use |

## Database (`tenants-db-lib`)

| Technology | Purpose | Status |
|---|---|---|
| Drizzle ORM + drizzle-kit | Schema, queries, migrations | In use |
| Parcel | Builds the library bundle | In use |
| Cloudflare D1 | Database storage, shared by the Astro and Rust Workers via bindings | In use |

## Platform & Tooling

| Technology | Purpose | Status |
|---|---|---|
| Cloudflare Workers | Hosting for the web app and API | In use |
| Wrangler | Local dev, deploy, D1 management | In use |
| Node.js 22 | Runtime for build tooling | In use |
| Package manager | JavaScript dependency management | npm |
| Testing | Unit and integration tests | To decide: Vitest (+ @cloudflare/vitest-pool-workers), cargo test |
| CI/CD | Build, test, deploy pipeline | To decide: GitHub Actions, Cloudflare Workers Builds |

## Platform Capabilities

| Capability | Purpose | Status |
|---|---|---|
| Authentication | Sign-in for tenant users and admins | To decide: Better Auth, Clerk, Cloudflare Access |
| Authorization | Tenant isolation and roles | To decide: app-level RBAC with `tenant_id` scoping |
| Payments | Subscription tiers and billing | To decide: Stripe Billing, Paddle, Lemon Squeezy |
| Analytics | Usage and tenant analytics | To decide: Workers Analytics Engine, PostHog, Plausible |

## Notes

- **D1 and multi-tenancy:** D1 bindings are declared statically in `wrangler.toml`, so a Worker cannot bind a new database per tenant at runtime. The plan is one shared D1 database with rows scoped by `tenant_id`.
- **D1 limits:** each D1 database has a storage size cap and processes writes one at a time. This suits tenant-management data; revisit if tenant product data grows large.
