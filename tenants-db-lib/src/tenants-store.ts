import { TenantEntity } from "./entities/tenant-entity";
import { tenantsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";

export class TenantsStore {
  #db: LibSQLDatabase;

  constructor(db: LibSQLDatabase) {
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

  async getTenantByID(tenant_id: string): Promise<TenantEntity | null> {
    console.log("Tenant Store: Get tenant by ID: ", tenant_id);
    const result = await this.#db.select().from(tenantsTable).where(eq(tenantsTable.tenant_id, tenant_id));
    console.log(result.length);
    
    if (result && result.length > 0) {
      return new TenantEntity(
        result[0].tenant_id,
        result[0].business_name,
        result[0].tenant_name,
        result[0].email,
        new Date(result[0].created_timestamp),
        new Date(result[0].updated_timestamp ?? new Date())
      );    
    }

    return null;
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