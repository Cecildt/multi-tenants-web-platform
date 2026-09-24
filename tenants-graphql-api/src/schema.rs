use async_graphql::{Context, InputObject, Object, SimpleObject};
use uuid::Uuid;
use worker::send::SendWrapper;
use worker::D1Database;

use crate::errors;
use crate::tenants;
use crate::validation;

/// A tenant record returned by the GraphQL API.
#[derive(SimpleObject)]
pub struct Tenant {
    pub tenant_id: String,
    pub business_name: String,
    pub tenant_name: String,
    pub email: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<tenants::TenantRow> for Tenant {
    fn from(row: tenants::TenantRow) -> Self {
        Tenant {
            tenant_id: row.tenant_id,
            business_name: row.business_name,
            tenant_name: row.tenant_name,
            email: row.email,
            created_at: tenants::to_iso8601(&row.created_timestamp),
            updated_at: tenants::to_iso8601(&row.updated_timestamp),
        }
    }
}

#[derive(InputObject)]
pub struct CreateTenantInput {
    pub business_name: String,
    pub tenant_name: String,
    pub email: String,
}

#[derive(InputObject)]
pub struct UpdateTenantInput {
    pub business_name: String,
    pub tenant_name: String,
    pub email: String,
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn tenants(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Tenant>> {
        let db = ctx.data::<SendWrapper<D1Database>>()?;
        let rows = tenants::fetch_all_tenants(db)
            .await
            .map_err(errors::db_error)?;
        Ok(rows.into_iter().map(Tenant::from).collect())
    }

    async fn tenant(
        &self,
        ctx: &Context<'_>,
        tenant_id: String,
    ) -> async_graphql::Result<Option<Tenant>> {
        let db = ctx.data::<SendWrapper<D1Database>>()?;
        let row = tenants::fetch_tenant_by_id(db, &tenant_id)
            .await
            .map_err(errors::db_error)?;
        Ok(row.map(Tenant::from))
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_tenant(
        &self,
        ctx: &Context<'_>,
        input: CreateTenantInput,
    ) -> async_graphql::Result<Tenant> {
        let valid =
            validation::normalize_input(&input.business_name, &input.tenant_name, &input.email)
                .map_err(errors::validation_error)?;
        let id = Uuid::new_v4().to_string();
        let db = ctx.data::<SendWrapper<D1Database>>()?;
        let row = tenants::insert_tenant(db, &id, &valid.business_name, &valid.tenant_name, &valid.email)
            .await
            .map_err(errors::db_error)?;
        Ok(Tenant::from(row))
    }

    async fn update_tenant(
        &self,
        ctx: &Context<'_>,
        tenant_id: String,
        input: UpdateTenantInput,
    ) -> async_graphql::Result<Option<Tenant>> {
        let valid =
            validation::normalize_input(&input.business_name, &input.tenant_name, &input.email)
                .map_err(errors::validation_error)?;
        let db = ctx.data::<SendWrapper<D1Database>>()?;
        let row = tenants::update_tenant(
            db,
            &tenant_id,
            &valid.business_name,
            &valid.tenant_name,
            &valid.email,
        )
        .await
        .map_err(errors::db_error)?;
        Ok(row.map(Tenant::from))
    }

    async fn delete_tenant(
        &self,
        ctx: &Context<'_>,
        tenant_id: String,
    ) -> async_graphql::Result<bool> {
        let db = ctx.data::<SendWrapper<D1Database>>()?;
        tenants::delete_tenant(db, &tenant_id)
            .await
            .map_err(errors::db_error)
    }
}
