# Deployment

## Overview

Cloudflare Workers is a serverless platform that enables developers to deploy code at the edge of Cloudflare’s global network. This allows for low-latency execution of code, which is ideal for building serverless applications that require high performance.

## Deployment Process

1. **Install Wrangler**: Wrangler is a CLI tool that makes it easy to develop, build, and deploy Cloudflare Workers. You can install Wrangler using npm:

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**: Before you can deploy a Worker, you need to login to your Cloudflare account using Wrangler:

   ```bash
   wrangler login
   ```

3. **Look up the D1 database ID**: Find the existing `tenants-db` D1 database in the Cloudflare dashboard (Storage & Databases → D1) or by running:

   ```bash
   wrangler d1 list
   ```

   Copy the `database_id` into the `DATABASE_ID` placeholder in `astro-web-platform/wrangler.toml` (all three occurrences: top level, `[env.development]`, and `[env.production]`).

4. **Apply database migrations** (run in `astro-web-platform`):

   ```bash
   npm run db:migrate:remote
   ```

5. **Seed the database** (run in `astro-web-platform`):

   ```bash
   npm run db:seed:remote
   ```

6. **Build and deploy** (run in `astro-web-platform`):

   ```bash
   npm run build && npm run deploy
   ```

