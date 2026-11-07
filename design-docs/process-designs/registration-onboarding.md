# Registration Onboarding

Registration Onboarding process is about signing up to use the system.

## Pre-conditions

- N/A

## Process Flows

```mermaid
journey
    title Registration Onboarding Journey 
    section Sign-up
      Input Basic Information: 5: Account Holder
      Create Instance: 5: System
    section Review Instance Setup
      Setup preferences: 5: Account Holder
      Create first case: 5: Account Holder

```

```mermaid
flowchart LR
  subgraph Client
    Signup[Sign-up]
    Instance[Instance Creation]
  end
  Signup-->Instance
```

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant Home as Home page
  participant SignUp as Sign-up page
  participant Bank
  Customer->>Home: Click Sign-up button
  Home->>SignUp: Provide basic information
  activate API
  API->>Bank: Authorise payment
  Bank-->>API: Approved
  API-->>Web: 201 Created
  deactivate API
  Web-->>Customer: Order confirmed
  Note over Customer,Bank: One order, one transaction


```

## Post-conditions

- Account holder has verified email address.
- Account instance is successfully created.
- No payment is required at sign-up. Payment is requested after 14 days.

## Data Input

- Company Name
- Account Holder Full name (First name, Last name)
- Country
- Account Holder Email address

## Data Output

- Instance ID
- Encryption Key
  - Used to encrypt clients personal information.
