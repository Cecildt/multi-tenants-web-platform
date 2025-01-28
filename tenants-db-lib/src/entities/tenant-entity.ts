export class TenantEntity {
  constructor(
    tenant_id: string = "",
    business_name: string = "",
    tenant_name: string = "",
    email: string = "",
    created_timestamp: Date = new Date(),
    updated_timestamp: Date = new Date()
  ) {
    this.tenant_id = tenant_id;
    this.business_name = business_name;
    this.tenant_name = tenant_name;
    this.email = email;
    this.created_timestamp = created_timestamp;
    this.updated_timestamp = updated_timestamp;
  }

  tenant_id: string;
  business_name: string;
  tenant_name: string;
  email: string;
  created_timestamp: Date;
  updated_timestamp: Date;
}
