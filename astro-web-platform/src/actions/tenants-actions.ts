import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

import {
  TenantsApiError,
  createTenant,
  deleteTenant,
  getTenant,
  updateTenant,
} from "../lib/tenants-api";

const FIELD_MAP: Record<string, string> = {
  businessName: "business_name",
  tenantName: "tenant_name",
  email: "email",
};

function handleApiError(err: unknown): never {
  if (err instanceof TenantsApiError) {
    const first = err.errors[0];
    if (first?.extensions?.code === "BAD_USER_INPUT") {
      const field = FIELD_MAP[first.extensions.field ?? ""] ?? first.extensions.field ?? "unknown";
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `${field}: ${first.message}`,
      });
    }
  }
  throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected error" });
}

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
      try {
        const tenant = await createTenant({
          businessName: business_name,
          tenantName: tenant_name,
          email,
        });
        return { tenant_id: tenant.tenantId };
      } catch (err) {
        handleApiError(err);
      }
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
      try {
        await updateTenant(tenant_id, {
          businessName: business_name,
          tenantName: tenant_name,
          email,
        });
        return { tenant_id };
      } catch (err) {
        handleApiError(err);
      }
    },
  }),
  deleteTenant: defineAction({
    accept: "json",
    input: z.object({
      tenant_id: z.string().trim(),
    }),
    handler: async ({ tenant_id }) => {
      try {
        await deleteTenant(tenant_id);
        return { tenant_id };
      } catch (err) {
        handleApiError(err);
      }
    },
  }),
  getTenant: defineAction({
    accept: "json",
    input: z.object({
      tenant_id: z.string().trim(),
    }),
    handler: async ({ tenant_id }) => {
      try {
        const tenant = await getTenant(tenant_id);
        if (tenant) {
          return {
            tenant_id: tenant.tenantId,
            business_name: tenant.businessName,
            tenant_name: tenant.tenantName,
            email: tenant.email,
            created_at: tenant.createdAt,
            updated_at: tenant.updatedAt,
          };
        }
        return {
          tenant_id: "",
          business_name: "",
          tenant_name: "",
          email: "",
          created_at: "",
          updated_at: "",
        };
      } catch (err) {
        handleApiError(err);
      }
    },
  }),
};
