# multi-tenants-web-platform

A platform to setup and manage  multi-tenants to support multiple web app products.

## Features

- [ ] Multi-tenants support
- [ ] User management
- [ ] Product management
- [ ] Subscription Tiers management
- [ ] Payment management
- [ ] Analytics management

## Design Docs

- [Tech Stack](./design-docs/tech-stack.md)
- [Architecture](./design-docs/architecture.md)
- [Database Schema](./design-docs/database-schema.md)
- [API Documentation](./design-docs/api-documentation.md)
- [Security](./design-docs/security.md)
- [Deployment](./design-docs/deployment.md)

## Development

### D1 Database

Look up the existing `tenants-db` D1 database ID using the Cloudflare dashboard
(Storage & Databases → D1) or:

```bash
wrangler d1 list
```

Copy the `database_id` into the `DATABASE_ID` placeholder in
`astro-web-platform/wrangler.toml` (all three occurrences: top level,
`[env.development]`, and `[env.production]`).

Whenever you make changes to the schema, generate a new migration (run in
`tenants-db-lib`):

```bash
npm run db:generate
```

Apply migrations to the local D1 database (run in `astro-web-platform`):

```bash
npm run db:migrate:local
```

Seed the local D1 database (run in `astro-web-platform`):

```bash
npm run db:seed:local
```
