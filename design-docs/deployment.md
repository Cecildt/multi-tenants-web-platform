# Deployment

## Overview

Cloudflare Workers is a serverless platform that enables developers to deploy code at the edge of Cloudflare’s global network. This allows for low-latency execution of code, which is ideal for building serverless applications that require high performance.

## Deployment Process

1. **Install Wrangler**:

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:

   ```bash
   wrangler login
   ```

3. **Create the D1 database** from `astro-web-platform/`:

   ```bash
   wrangler d1 create tenants-db
   ```

4. **Generate the latest SQL migration** from `tenants-db-lib/`:

   ```bash
   npm run db:generate
   ```

5. **Apply the migration remotely** from `astro-web-platform/`:

   ```bash
   npm run db:migrate:remote
   ```

6. **Seed the remote database** from `astro-web-platform/`:

   ```bash
   npm run db:seed:remote
   ```

7. **Build and deploy** from `astro-web-platform/`:

   ```bash
   npm run build
   npm run deploy
   ```
