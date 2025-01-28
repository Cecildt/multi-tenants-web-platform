import { sql } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const tenantsTable = sqliteTable('tenants', {
  tenant_id: text('tenant_id').notNull().primaryKey(),
  tenant_name: text('tenant_name').notNull(),
  business_name: text('business_name').notNull(),
  email: text('email').notNull(),
  created_timestamp: text('created_timestamp').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updated_timestamp: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});


export type InsertTenants = typeof tenantsTable.$inferInsert;
export type SelectTenants = typeof tenantsTable.$inferSelect;
