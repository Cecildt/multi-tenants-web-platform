# Spec Delta

## Purpose

Provides the GraphQL endpoint that is the only way to read and change tenant records in the tenants database, for the admin web app and any future clients.

## ADDED Requirements

### Requirement: GraphQL endpoint
The API SHALL serve GraphQL over HTTP at the path `/graphql`, accepting `POST` requests with a JSON body `{ "query": string, "variables"?: object, "operationName"?: string }` and responding with a JSON GraphQL response (`data` and/or `errors`). Requests to any other path SHALL return HTTP 404. Non-`POST` requests to `/graphql` SHALL return HTTP 405.

#### Scenario: Valid query over POST
- **WHEN** a client sends `POST /graphql` with body `{"query":"{ tenants { tenantId } }"}`
- **THEN** the API responds with HTTP 200, `Content-Type: application/json`, and a body containing `data.tenants`

#### Scenario: Unknown path
- **WHEN** a client sends `GET /`
- **THEN** the API responds with HTTP 404

#### Scenario: Wrong method on the endpoint
- **WHEN** a client sends `GET /graphql`
- **THEN** the API responds with HTTP 405

#### Scenario: Malformed request body
- **WHEN** a client sends `POST /graphql` with a body that is not valid JSON
- **THEN** the API responds with HTTP 400 and a GraphQL `errors` array

### Requirement: Tenant type
The schema SHALL expose a `Tenant` object type with the non-null fields `tenantId: ID!`, `businessName: String!`, `tenantName: String!`, `email: String!`, `createdAt: String!`, and `updatedAt: String!`. `createdAt` and `updatedAt` SHALL be ISO 8601 UTC timestamps in the form `YYYY-MM-DDTHH:MM:SSZ`.

#### Scenario: Timestamp format
- **WHEN** a tenant row was stored with `created_timestamp` `2026-09-24 10:15:00`
- **THEN** the API returns that tenant's `createdAt` as `2026-09-24T10:15:00Z`

### Requirement: List tenants
The schema SHALL provide a query `tenants: [Tenant!]!` that returns every tenant in the database.

#### Scenario: Seeded database
- **WHEN** the database holds the two seed tenants and a client queries `tenants`
- **THEN** the response contains exactly two tenants, including `tenant_john_001` and `tenant_jane_001` with their stored fields

#### Scenario: Empty database
- **WHEN** the database holds no tenants and a client queries `tenants`
- **THEN** the response contains `data.tenants` as an empty list and no errors

### Requirement: Get tenant by ID
The schema SHALL provide a query `tenant(tenantId: ID!): Tenant` that returns the matching tenant, or `null` when no tenant has that ID.

#### Scenario: Existing tenant
- **WHEN** a client queries `tenant(tenantId: "tenant_john_001")`
- **THEN** the response contains that tenant's fields

#### Scenario: Unknown tenant
- **WHEN** a client queries `tenant(tenantId: "does-not-exist")`
- **THEN** the response contains `data.tenant` as `null` and no errors

### Requirement: Create tenant
The schema SHALL provide a mutation `createTenant(input: CreateTenantInput!): Tenant!` where `CreateTenantInput` has `businessName: String!`, `tenantName: String!`, and `email: String!`. The API SHALL generate the tenant ID, set `createdAt` and `updatedAt` to the current time, store the tenant, and return it.

#### Scenario: Successful create
- **WHEN** a client calls `createTenant` with `businessName: "Acme Ltd"`, `tenantName: "acme"`, `email: "ops@acme.test"`
- **THEN** the response contains a tenant with a non-empty, newly generated `tenantId` and the given fields, and a later `tenant(tenantId: <that id>)` query returns the same tenant

#### Scenario: Generated IDs are unique
- **WHEN** a client calls `createTenant` twice with identical input
- **THEN** the two returned tenants have different `tenantId` values

### Requirement: Update tenant
The schema SHALL provide a mutation `updateTenant(tenantId: ID!, input: UpdateTenantInput!): Tenant` where `UpdateTenantInput` has `businessName: String!`, `tenantName: String!`, and `email: String!`. The API SHALL replace those three fields, set `updatedAt` to the current time, leave `createdAt` unchanged, and return the updated tenant. When no tenant has that ID, it SHALL return `null` and change nothing.

#### Scenario: Successful update
- **WHEN** a client calls `updateTenant` for `tenant_john_001` with a new `email`
- **THEN** the returned tenant has the new `email`, the same `createdAt`, and an `updatedAt` no earlier than before

#### Scenario: Update of unknown tenant
- **WHEN** a client calls `updateTenant` with `tenantId: "does-not-exist"`
- **THEN** the response contains `data.updateTenant` as `null` and no row is created

### Requirement: Delete tenant
The schema SHALL provide a mutation `deleteTenant(tenantId: ID!): Boolean!` that removes the tenant and returns `true` when a row was deleted, or `false` when no tenant had that ID.

#### Scenario: Delete existing tenant
- **WHEN** a client calls `deleteTenant(tenantId: "tenant_jane_001")`
- **THEN** the response is `true` and a later `tenant(tenantId: "tenant_jane_001")` query returns `null`

#### Scenario: Delete unknown tenant
- **WHEN** a client calls `deleteTenant(tenantId: "does-not-exist")`
- **THEN** the response is `false` and no other tenant is affected

### Requirement: Input validation
For `createTenant` and `updateTenant`, the API SHALL trim `businessName`, `tenantName`, and `email`, lowercase `tenantName`, and reject the mutation without changing data when `businessName` or `tenantName` is shorter than 3 characters after trimming or `email` is not a valid email address. A rejected mutation SHALL return a GraphQL error with `extensions.code` `BAD_USER_INPUT` and `extensions.field` naming the offending input field (`businessName`, `tenantName`, or `email`).

#### Scenario: Name too short
- **WHEN** a client calls `createTenant` with `tenantName: " ab "`
- **THEN** the response has an error with `extensions.code` `BAD_USER_INPUT` and `extensions.field` `tenantName`, and no tenant is stored

#### Scenario: Normalized input
- **WHEN** a client calls `createTenant` with `tenantName: "  AcMe "`
- **THEN** the stored and returned `tenantName` is `acme`

### Requirement: Internal errors are not leaked
When a database operation fails, the API SHALL return a GraphQL error with `extensions.code` `INTERNAL_SERVER_ERROR` and a generic message, and SHALL NOT include SQL text or database error details in the response.

#### Scenario: Database failure
- **WHEN** the D1 query for `tenants` fails
- **THEN** the response has an error with `extensions.code` `INTERNAL_SERVER_ERROR` and its message contains no SQL

### Requirement: No public access in production
Until API authentication exists, the production deployment SHALL NOT be reachable on a public `workers.dev` URL or route. It SHALL be reachable only through a Cloudflare service binding from the admin web app.

#### Scenario: Production public URL
- **WHEN** the API is deployed to production and a client requests its `workers.dev` hostname
- **THEN** the request does not reach the API
