# Spec Delta

## Purpose

Covers how administrators list, view, create, edit, and delete tenants in the Astro admin web app, and requires the app to reach tenant data only through the tenants GraphQL API.

## ADDED Requirements

### Requirement: Tenant data only through the GraphQL API
The admin web app SHALL read and change tenant data only by calling the tenants GraphQL API from server-side code. It SHALL NOT have a database binding, SHALL NOT depend on `tenants-db-lib`, and SHALL NOT send GraphQL requests from the browser.

#### Scenario: No database access in the web app
- **WHEN** the web app's dependencies and Worker configuration are inspected
- **THEN** there is no `tenants-db-lib` dependency and no D1 database binding

#### Scenario: Browser traffic
- **WHEN** an administrator opens tenant details in the browser
- **THEN** the browser calls the app's own action endpoint, and only the app's server calls the GraphQL API

### Requirement: API connection configuration
The web app SHALL reach the API through a Cloudflare service binding named `TENANTS_API` when that binding is present. When it is absent, it SHALL send requests to the URL in the `GRAPHQL_API_URL` variable. When neither is configured, tenant operations SHALL fail with an error naming both settings.

#### Scenario: Deployed with a service binding
- **WHEN** the app runs with the `TENANTS_API` binding
- **THEN** GraphQL requests go through the binding and `GRAPHQL_API_URL` is not used

#### Scenario: Local dev with a URL
- **WHEN** the app runs without `TENANTS_API` and with `GRAPHQL_API_URL=http://localhost:8787/graphql`
- **THEN** GraphQL requests go to that URL

#### Scenario: Missing configuration
- **WHEN** the app runs with neither setting and the tenants page loads
- **THEN** the page shows an error, and the server log names `TENANTS_API` and `GRAPHQL_API_URL`

### Requirement: List tenants in the grid
The home page tenants grid SHALL show every tenant returned by the API with its ID, business name, tenant name, email, created date, and updated date.

#### Scenario: Seeded tenants
- **WHEN** the API returns the two seed tenants and an administrator opens `/`
- **THEN** the grid shows two rows with those tenants' fields and ISO 8601 dates

#### Scenario: API unavailable
- **WHEN** the API request for the grid fails
- **THEN** the page still renders and shows an error message in place of the grid instead of an unhandled server error

### Requirement: View tenant details
The Details button SHALL open a dialog that shows the selected tenant's ID, business name, tenant name, email, created date, and updated date, fetched from the API.

#### Scenario: Open details
- **WHEN** an administrator clicks Details on the `tenant_john_001` row
- **THEN** the dialog shows `tenant_john_001`'s fields as returned by the API

#### Scenario: Tenant no longer exists
- **WHEN** an administrator opens details for a tenant that was deleted after the grid loaded
- **THEN** the dialog shows empty or "unknown" values and does not throw

### Requirement: Create tenant
Submitting the create tenant form with valid input SHALL create the tenant through the API and redirect to `/?tenant_id=<new id>`, where the ID is the one the API generated. Invalid input SHALL re-render the form with per-field error messages and the submitted values, without calling the API. When the API rejects the input, the form SHALL show the API's message next to the field it names.

#### Scenario: Valid create
- **WHEN** an administrator submits business name `Acme Ltd`, tenant name `acme`, and email `ops@acme.test`
- **THEN** the browser is redirected to `/?tenant_id=<id>` and the grid lists the new tenant

#### Scenario: Form validation failure
- **WHEN** an administrator submits a tenant name shorter than 3 characters
- **THEN** the form shows an error for tenant name, keeps the other values, and no tenant is created

### Requirement: Edit tenant
The edit page `/tenants/<tenant_id>` SHALL load the tenant's current business name, tenant name, and email from the API into the form. Submitting valid changes SHALL update the tenant through the API and redirect to `/?tenant_id=<tenant_id>`. When the tenant doesn't exist, the page SHALL respond with HTTP 404.

#### Scenario: Prefilled form
- **WHEN** an administrator opens `/tenants/tenant_john_001`
- **THEN** the form fields contain that tenant's current values

#### Scenario: Save changes
- **WHEN** an administrator changes the email and submits
- **THEN** the browser is redirected to `/?tenant_id=tenant_john_001` and the grid shows the new email and a later updated date

#### Scenario: Unknown tenant
- **WHEN** an administrator opens `/tenants/does-not-exist`
- **THEN** the response is HTTP 404

### Requirement: Delete tenant
Confirming the delete dialog SHALL delete the tenant through the API.

#### Scenario: Confirm delete
- **WHEN** an administrator confirms deleting `tenant_jane_001` and reloads `/`
- **THEN** the grid no longer lists `tenant_jane_001`
