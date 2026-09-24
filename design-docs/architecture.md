# Architecture Design

## Projects Structure

- astro-web-platform: The main administration web application.
- tenants-graphql-api: The GraphQL API for managing tenants.
- tenants-db: The database for storing tenant data.

## Top-Level interactions

astro-web-platform is the main administration web application which calls the tenants-graphql-api service GraphQL API endpoints.
