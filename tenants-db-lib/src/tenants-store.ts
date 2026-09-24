import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { tenantsTable } from "../db/schema";
import { TenantEntity } from "./entities/tenant-entity";

export class TenantsStore {
	#db: DrizzleD1Database;

	constructor(db: DrizzleD1Database) {
		this.#db = db;
	}

	async getTenants(): Promise<TenantEntity[]> {
		const rows = await this.#db.select().from(tenantsTable);
		return rows.map(
			(row) =>
				new TenantEntity(
					row.tenant_id,
					row.business_name,
					row.tenant_name,
					row.email,
					new Date(row.created_timestamp),
					new Date(row.updated_timestamp)
				)
		);
	}

	async getTenantByID(tenant_id: string): Promise<TenantEntity | null> {
		const rows = await this.#db
			.select()
			.from(tenantsTable)
			.where(eq(tenantsTable.tenant_id, tenant_id));
		if (rows.length === 0) return null;
		const row = rows[0];
		return new TenantEntity(
			row.tenant_id,
			row.business_name,
			row.tenant_name,
			row.email,
			new Date(row.created_timestamp),
			new Date(row.updated_timestamp)
		);
	}

	async deleteTenant(tenant_id: string): Promise<void> {
		await this.#db
			.delete(tenantsTable)
			.where(eq(tenantsTable.tenant_id, tenant_id));
	}
}
