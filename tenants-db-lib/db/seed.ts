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

  const john_tenant: typeof tenantsTable.$inferInsert = {
    tenant_id: nanoid(),
    tenant_name: 'John Doe',
    business_name: 'John Doe Inc.',
    email: 'john@example.com',
  };

  await db.insert(tenantsTable).values(john_tenant);

  const jane_tenant: typeof tenantsTable.$inferInsert = {
    tenant_id: nanoid(),
    tenant_name: 'Jane Doe',
    business_name: 'Jane Doe Inc.',
    email: 'jane@abc.com'
  };

  await db.insert(tenantsTable).values(jane_tenant);

  console.log('New tenants created!')

  const tenants = await db.select().from(tenantsTable);
  console.log('Getting all tenants from the database: ', tenants)
}

main();
