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

1. Login to Cloudflare and create the D1 database from `astro-web-platform/`:

```bash
wrangler login
wrangler d1 create tenants-db
```

2. Whenever you change the schema, generate the SQL migration from `tenants-db-lib/`:

```bash
npm run db:generate
```

3. Apply the migration locally from `astro-web-platform/`:

```bash
npm run db:migrate:local
```

4. Seed the local D1 database from `astro-web-platform/`:

```bash
npm run db:seed:local
```

5. When ready, apply the same migration and seed data remotely from `astro-web-platform/`:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```
