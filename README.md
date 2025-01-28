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

### Turso

```bash
    turso auth login
```

```bash
    turso db show --url <database-name>
```

```bash
    turso db tokens create <database-name>
```

Whenever you make changes to the schema, run db:generate:

```bash
    npm run db:generate
```

Now apply these changes to the database with db:migrate:

```bash
    npm run db:migrate
```

To apply the seed data to the database, run db:seed:

```bash
    npm run db:seed
```

To apply db schema changes quickly, run db:push:

```bash
    npm run db:push
```

To reset the database, run db:reset:

```bash
    npm run db:reset
```
