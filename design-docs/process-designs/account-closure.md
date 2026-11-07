# Account Closure

Account closure process is the process of closing an account from the system.

## Pre-conditions

- Customer has an up-to-date payment history.

## Process Flow

High-level process

```mermaid
flowchart LR
  subgraph Customer
    Account[Account closure request]
    Tenants[Tenants Platform closes account]
    Email[Email confirm closure]
  end
  
  Account-->Tenants-->Email
```

Detailed sequence diagram

```mermaid
sequenceDiagram
  autonumber
  actor Customer

  box MediationHub Application
    participant Account as Account page
    participant Closure as Closure page
    participant HubBackend as Backend API System
  end

  box Multi Tenants Platform
    participant Tenants as Tenants Backend API System

  end
  participant Email as Email System

  Customer->>Account: Request account closure
  Account->>HubBackend: Close account
  HubBackend->>HubBackend: Delete Account data
  HubBackend->>Tenants: Confirm account data deletion and closure
  Tenants->>Tenants: Account closure
  Tenants-->>Email: Send account closure email
  Email-->>Customer: Sent email to Customer
  Tenants-->>HubBackend: Confirm account closure
  HubBackend->>Closure: Redirect Customer
  Closure-->>Customer: Show Closure page

```

## Post-conditions

- Account data is delete from MediationHub.
- Account is closed on Multi Tenants Platform.
- TODO: Process refunds

## Data Input

- Account payment status
- Account ID

## Data Output

- Account closure status
