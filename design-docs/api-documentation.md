# API Documentation

## GraphQL API (`tenants-graphql-api`)

The API is served at `POST /graphql`. Requests must have a JSON body `{ "query": string, "variables"?: object }`.

### Types

```graphql
type Tenant {
  tenantId: ID!
  businessName: String!
  tenantName: String!
  email: String!
  createdAt: String!   # ISO 8601 UTC: YYYY-MM-DDTHH:MM:SSZ
  updatedAt: String!   # ISO 8601 UTC: YYYY-MM-DDTHH:MM:SSZ
}

input CreateTenantInput {
  businessName: String!
  tenantName: String!
  email: String!
}

input UpdateTenantInput {
  businessName: String!
  tenantName: String!
  email: String!
}
```

### Queries

```graphql
type Query {
  tenants: [Tenant!]!
  tenant(tenantId: ID!): Tenant
}
```

### Mutations

```graphql
type Mutation {
  createTenant(input: CreateTenantInput!): Tenant!
  updateTenant(tenantId: ID!, input: UpdateTenantInput!): Tenant
  deleteTenant(tenantId: ID!): Boolean!
}
```

### Error Codes

| `extensions.code`       | Meaning                                                         |
|-------------------------|-----------------------------------------------------------------|
| `BAD_USER_INPUT`        | Input failed validation. `extensions.field` names the field.   |
| `INTERNAL_SERVER_ERROR` | A database or unexpected error occurred (details not exposed).  |

### Example

```bash
curl -X POST http://localhost:8787/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ tenants { tenantId businessName tenantName email createdAt updatedAt } }"}'
```
