# Registration Onboarding

Registration Onboarding process is about signing up to use the system.

## Pre-conditions

- N/A

## Process Flows

High-level process

```mermaid
flowchart LR
  subgraph Customer
    Signup[Sign-up]
    Instance[Instance Creation]
    Email[Email Confirmation]
  end
  Signup-->Instance-->Email
```

Detailed sequence diagram

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  box MediationHub Application
    participant Home as Home page
    participant SignUp as Sign-up page
    participant Landing as Landing page
    participant MediationHub as Backend API System
  end
  participant Tenants as Tenants API System
  participant Email as Email System
  
  Customer->>Home: Click Sign-up button
  Home->>SignUp: Provide basic information
  SignUp->>Tenants: Record customer information
  Tenants->>MediationHub: Request tenant creation
  MediationHub->>Tenants: Tenant instance created.
  Tenants-->>Email: Request email confirmation
  Email-->>Customer: Sent email confirmation
  Tenants->>Landing: Redirect to Tenant instance
  
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
