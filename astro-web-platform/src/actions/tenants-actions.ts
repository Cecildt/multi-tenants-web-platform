import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { nanoid } from "nanoid";

import tenant_db_lib from "tenants-db-lib";

// import { db, Comment } from 'astro:db';

export const tenants = {
  addTenant: defineAction({
    accept: "form",
    input: z.object({
      business_name: z.string().min(3, "Company name is required").trim(),
      tenant_name: z
        .string()
        .min(3, "Tenant name is required")
        .toLowerCase()
        .trim(),
      email: z.string().email("Valid email is required").trim(),
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

      return { tenant_id: tenant_id };
    },
  }),
  editTenant: defineAction({
    accept: "form",
    input: z.object({
      tenant_id: z.string().trim(),
      business_name: z.string().min(3, "Company name is required").trim(),
      tenant_name: z
        .string()
        .min(3, "Tenant name is required")
        .toLowerCase()
        .trim(),
      email: z.string().email("Valid email is required").trim(),
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

      return { tenant_id: tenant_id };
    },
  }),
  deleteTenant: defineAction({
    accept: "json",
    input: z.object({
      tenant_id: z.string().trim(),
    }),
    handler: async ({ tenant_id }) => {
      console.log("Delete tenant: ", tenant_id);

      const data_stores = tenant_db_lib();
      await data_stores.tenants().deleteTenant(tenant_id);

      return { tenant_id: tenant_id };
    },
  }),
  getTenant: defineAction({
    accept: "json",
    input: z.object({
      tenant_id: z.string().trim(),
    }),
    handler: async ({ tenant_id }) => {
      console.log("Get tenant: ", tenant_id);

      const data_stores = tenant_db_lib();
      let tenant = await data_stores.tenants().getTenantByID(tenant_id);


      if (tenant) {
        return {
          tenant_id: tenant.tenant_id,
          business_name: tenant.business_name,
          tenant_name: tenant.tenant_name,
          email: tenant.email,
          created_at: tenant.created_timestamp,
          updated_at: tenant.updated_timestamp,
        };
      } 

      return {
        tenant_id: '',
        business_name: '',
        tenant_name: '',
        email: '',
        created_at: '',
        updated_at: '',
      };
    },
  }),
};
