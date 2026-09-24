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
`tenants-graphql-api/wrangler.toml`.

Whenever you make changes to the schema, generate a new migration (run in
`tenants-db-lib`):

```bash
npm run db:generate
```

### Local Development

1. Apply migrations and seed the local D1 database (run in `tenants-graphql-api`):

   ```bash
   npm install
   npm run db:migrate:local
   npm run db:seed:local
   ```

2. Start the GraphQL API (run in `tenants-graphql-api`):

   ```bash
   npm run dev
   ```

3. Copy the example dev vars file and start Astro (run in `astro-web-platform`):

   ```bash
   cp .dev.vars.example .dev.vars
   npm run dev
   ```

The admin app is available at `http://localhost:4321`. The migrate and seed scripts
now live in `tenants-graphql-api`.
