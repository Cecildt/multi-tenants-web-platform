import { TenantEntity } from "./entities/tenant-entity";

export class TenantsStore {
  constructor() {
  }

  getTenants(): TenantEntity[] {
    console.log("Tenant Store: Get tenants");

    return [];
  }

  getTenantByID(tenant_id: string): TenantEntity {
    console.log("Tenant Store: Get tenant by ID");
    return new TenantEntity(tenant_id, 'Test Business', 'Test Tenant', 'qwerty@test.co', new Date(), new Date());
  }

  addTenant(tenant: TenantEntity) {
    console.log("Tenant Store: Add tenant");
  }

  editTenant(tenant: TenantEntity) {
    console.log("Tenant Store: Edit tenant");
  }

  deleteTenant(tenant_id: string) {
    console.log("Tenant Store: Delete tenant");
  }
}