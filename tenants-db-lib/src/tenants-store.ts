import { TenantEntity } from "./entities/tenant-entity";
import { tenantsTable } from "../db/schema";

export class TenantsStore {
  #db: any;

  constructor(db: any) {
    console.log("Tenant Store: Constructor");
    this.#db = db;
  }

  async getTenants(): Promise<TenantEntity[]> {
    console.log("Tenant Store: Get tenants");
    const result = await this.#db.select().from(tenantsTable).all();

    if (result) {
      return result.map((tenant: any) => {
        return new TenantEntity(
          tenant.tenant_id,
          tenant.business_name,
          tenant.tenant_name,
          tenant.email,
          new Date(tenant.created_timestamp),
          new Date(tenant.updated_timestamp)
        );
      });
    }
        
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