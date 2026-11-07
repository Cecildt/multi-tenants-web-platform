# Account Lock

Account Lock process is about an locking account holder access to not login to an application instance due to business rules. 

## Pre-conditions

- Email address not confirmed.
- Payment not made.

## Process Flow

High-level process

```mermaid
flowchart LR
  Cron[Weekly Cron Job execute]
  Validate[Validate pre-condition rules]
  Tenants[Tenants Platform lock invalid accounts]
  Email[Email Account Locked Status]

  Cron-->Validate-->Tenants-->Email
```

Detailed sequence diagram

```mermaid
sequenceDiagram
  autonumber
  box Multi Tenants Platform
    participant Cron as Scheduled Cron Job (Weekly)
    participant Tenants as Tenants API System
  end
  participant Email as Email System
  actor Customer
  
  Cron->>Tenants: Validate accounts
  Tenants->>Tenants: Lock invalid accounts
  Tenants->>Email: Email customers about accounts locked.
  Email-->>Customer: Send emails

```

## Post-conditions

- Invalid Accounts are locked.
- Customers are informed via email.
- TODO: Map reactivation process to unlock account.

## Data Input

- Account email address confirmation status.
- Account payment status.

## Data Output

- Account locked status.
