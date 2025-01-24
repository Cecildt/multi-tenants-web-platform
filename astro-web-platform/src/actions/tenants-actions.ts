import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { nanoid } from 'nanoid';
// import { db, Comment } from 'astro:db';

export const tenants = {
  addTenant: defineAction({
    accept: 'form',
    input: z.object({
      business_name: z.string().min(3, 'Company name is required').trim(),
      tenant_name: z.string().min(3, 'Tenant name is required').toLowerCase().trim(),
      email: z.string().email('Valid email is required').trim(),
    }),
    handler: async ({ business_name, tenant_name, email }) => {
      const tenant_id = nanoid();
        console.log(tenant_id, business_name, tenant_name, email);
    //   const comment = await db
    //     .insert(Comment)
    //     .values({
    //       postSlug,
    //       name,
    //       email,
    //       message,
    //       createdAt: new Date(),
    //     })
    //     .returning();

    //   return comment[0];
    },
  }),
  editTenant: defineAction({
    accept: 'form',
    input: z.object({
      tenant_id: z.string().trim(),
      business_name: z.string().min(3, 'Company name is required').trim(),
      tenant_name: z.string().min(3, 'Tenant name is required').toLowerCase().trim(),
      email: z.string().email('Valid email is required').trim(),
    }),
    handler: async ({ tenant_id, business_name, tenant_name, email }) => {
        console.log(tenant_id, business_name, tenant_name, email);
    //   const comment = await db
    //     .insert(Comment)
    //     .values({
    //       postSlug,
    //       name,
    //       email,
    //       message,
    //       createdAt: new Date(),
    //     })
    //     .returning();

    //   return comment[0];
    },
  }),
  deleteTenant: defineAction({
    accept: 'form',
    input: z.object({
      tenant_id: z.string().trim(),
    }),
    handler: async ({ tenant_id }) => {
        console.log("Delete tenant: ", tenant_id);
    //   const comment = await db
    //     .insert(Comment)
    //     .values({
    //       postSlug,
    //       name,
    //       email,
    //       message,
    //       createdAt: new Date(),
    //     })
    //     .returning();

    //   return comment[0];
    },
  }),
};