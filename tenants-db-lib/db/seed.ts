import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { tenantsTable } from './schema';
import { nanoid } from 'nanoid';

async function main() {
  const db = drizzle({ 
    connection: { 
        url: process.env.TURSO_DATABASE_URL!, 
        authToken: process.env.TURSO_AUTH_TOKEN!
    }
  });

  const tenant: typeof tenantsTable.$inferInsert = {
    tenant_id: nanoid(),
    tenant_name: 'John Doe',
    business_name: 'John Doe Inc.',
    email: 'john@example.com',
    // created_timestamp: new Date().toISOString(),
  };

  await db.insert(tenantsTable).values(tenant);
  console.log('New tenant created!')

  const tenants = await db.select().from(tenantsTable);
  console.log('Getting all tenants from the database: ', tenants)
}

main();
