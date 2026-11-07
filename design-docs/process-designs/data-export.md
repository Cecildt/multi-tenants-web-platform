# Data Export

Data Export process is about an account holder requesting the export of all their data in the system to be downloaded. 

## Pre-conditions

- - Customer has an up-to-date payment history.

## Process Flow

High-level process

```mermaid
flowchart LR
  subgraph Customer
    Data[Export data request]
    Hub[Mediation Hub application prepares data export files]
    Tenant[Get tenant information]
    Email[Email confirm data export]
  end
  
  Data-->Hub-->Email
  Hub-->Tenant

```

Detailed sequence diagram

```mermaid
sequenceDiagram
  autonumber
  actor Customer

  box MediationHub Application
    participant Account as Account page
    participant DataExport as Data Export page
    participant HubBackend as Backend API System
  end

  box Multi Tenants Platform
    participant Tenants as Tenants Backend API System

  end
  participant Email as Email System

  Customer->>Account: Request data export
  Account->>HubBackend: Create data export files
  HubBackend->>HubBackend: Prepare data export file
  HubBackend->>Tenants: Get tenant information
  Tenants->>Tenants: Prepare tenant information
  Tenants-->>HubBackend: Return tenant information
  HubBackend->>HubBackend: Create data zip archive
  HubBackend-->>Email: Data export ready for download email
  Email-->>Customer: Sent email to Customer
  HubBackend->>DataExport: Redirect Customer
  DataExport-->>Customer: Show Data Export page

```

## Post-conditions

- TBD

## Data Input

- TBD

## Data Output

- TBD
