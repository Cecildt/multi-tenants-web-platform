import { env } from "cloudflare:workers";

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

type CloudflareEnv = { TENANTS_API?: Fetcher; GRAPHQL_API_URL?: string };

export class TenantsApiError extends Error {
  constructor(
    public errors: Array<{
      message: string;
      extensions?: { code: string; field?: string };
    }>
  ) {
    super(errors[0]?.message ?? "Unknown API error");
    this.name = "TenantsApiError";
  }
}

export interface Tenant {
  tenantId: string;
  businessName: string;
  tenantName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

type GqlResponse<T> = { data?: T; errors?: Array<{ message: string; extensions?: { code: string; field?: string } }> };

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const e = env as unknown as CloudflareEnv;
  const body = JSON.stringify({ query, variables });
  const headers = { "Content-Type": "application/json" };

  let response: Response;

  if (e.TENANTS_API) {
    response = await e.TENANTS_API.fetch("https://tenants-api/graphql", {
      method: "POST",
      headers,
      body,
    });
  } else if (e.GRAPHQL_API_URL) {
    response = await fetch(e.GRAPHQL_API_URL, {
      method: "POST",
      headers,
      body,
    });
  } else {
    throw new Error(
      "GraphQL API is not configured. Set TENANTS_API service binding or GRAPHQL_API_URL environment variable."
    );
  }

  const result = (await response.json()) as GqlResponse<T>;

  if (result.errors?.length) {
    throw new TenantsApiError(result.errors);
  }

  return result.data as T;
}

export async function listTenants(): Promise<Tenant[]> {
  const data = await gql<{ tenants: Tenant[] }>(`
    query {
      tenants {
        tenantId
        businessName
        tenantName
        email
        createdAt
        updatedAt
      }
    }
  `);
  return data.tenants;
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const data = await gql<{ tenant: Tenant | null }>(
    `
    query GetTenant($tenantId: ID!) {
      tenant(tenantId: $tenantId) {
        tenantId
        businessName
        tenantName
        email
        createdAt
        updatedAt
      }
    }
  `,
    { tenantId }
  );
  return data.tenant;
}

export async function createTenant(input: {
  businessName: string;
  tenantName: string;
  email: string;
}): Promise<Tenant> {
  const data = await gql<{ createTenant: Tenant }>(
    `
    mutation CreateTenant($input: CreateTenantInput!) {
      createTenant(input: $input) {
        tenantId
        businessName
        tenantName
        email
        createdAt
        updatedAt
      }
    }
  `,
    { input }
  );
  return data.createTenant;
}

export async function updateTenant(
  tenantId: string,
  input: { businessName: string; tenantName: string; email: string }
): Promise<Tenant | null> {
  const data = await gql<{ updateTenant: Tenant | null }>(
    `
    mutation UpdateTenant($tenantId: ID!, $input: UpdateTenantInput!) {
      updateTenant(tenantId: $tenantId, input: $input) {
        tenantId
        businessName
        tenantName
        email
        createdAt
        updatedAt
      }
    }
  `,
    { tenantId, input }
  );
  return data.updateTenant;
}

export async function deleteTenant(tenantId: string): Promise<boolean> {
  const data = await gql<{ deleteTenant: boolean }>(
    `
    mutation DeleteTenant($tenantId: ID!) {
      deleteTenant(tenantId: $tenantId)
    }
  `,
    { tenantId }
  );
  return data.deleteTenant;
}
