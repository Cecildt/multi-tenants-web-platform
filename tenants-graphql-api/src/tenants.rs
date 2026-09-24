use serde::Deserialize;
use worker::send::{SendFuture, SendWrapper};
use worker::D1Database;

#[derive(Debug, Deserialize)]
pub struct TenantRow {
    pub tenant_id: String,
    pub business_name: String,
    pub tenant_name: String,
    pub email: String,
    pub created_timestamp: String,
    pub updated_timestamp: String,
}

/// Convert D1's stored format `"YYYY-MM-DD HH:MM:SS"` to ISO 8601 `"YYYY-MM-DDTHH:MM:SSZ"`.
/// Passes through any value that doesn't match that exact pattern.
pub fn to_iso8601(s: &str) -> String {
    if s.len() == 19
        && s.as_bytes().get(4) == Some(&b'-')
        && s.as_bytes().get(7) == Some(&b'-')
        && s.as_bytes().get(10) == Some(&b' ')
    {
        let mut out = String::with_capacity(20);
        out.push_str(&s[..10]);
        out.push('T');
        out.push_str(&s[11..19]);
        out.push('Z');
        out
    } else {
        #[cfg(target_arch = "wasm32")]
        worker::console_warn!("Unexpected timestamp format: {}", s);
        #[cfg(not(target_arch = "wasm32"))]
        eprintln!("Unexpected timestamp format: {}", s);
        s.to_string()
    }
}

const SELECT_COLS: &str =
    "tenant_id, business_name, tenant_name, email, created_timestamp, updated_timestamp";

pub async fn fetch_all_tenants(db: &SendWrapper<D1Database>) -> worker::Result<Vec<TenantRow>> {
    let stmt = db.0.prepare(&format!("SELECT {} FROM tenants", SELECT_COLS));
    let result = SendFuture::new(stmt.all()).await?;
    result.results::<TenantRow>()
}

pub async fn fetch_tenant_by_id(
    db: &SendWrapper<D1Database>,
    tenant_id: &str,
) -> worker::Result<Option<TenantRow>> {
    let stmt = db
        .0
        .prepare(&format!(
            "SELECT {} FROM tenants WHERE tenant_id = ?1",
            SELECT_COLS
        ))
        .bind(&[tenant_id.into()])?;
    SendFuture::new(stmt.first::<TenantRow>(None)).await
}

pub async fn insert_tenant(
    db: &SendWrapper<D1Database>,
    id: &str,
    business_name: &str,
    tenant_name: &str,
    email: &str,
) -> worker::Result<TenantRow> {
    let stmt = db
        .0
        .prepare(&format!(
            "INSERT INTO tenants (tenant_id, business_name, tenant_name, email) \
             VALUES (?1, ?2, ?3, ?4) RETURNING {}",
            SELECT_COLS
        ))
        .bind(&[
            id.into(),
            business_name.into(),
            tenant_name.into(),
            email.into(),
        ])?;
    let result = SendFuture::new(stmt.all()).await?;
    let mut rows = result.results::<TenantRow>()?;
    rows.pop()
        .ok_or_else(|| worker::Error::RustError("INSERT RETURNING returned no row".into()))
}

pub async fn update_tenant(
    db: &SendWrapper<D1Database>,
    tenant_id: &str,
    business_name: &str,
    tenant_name: &str,
    email: &str,
) -> worker::Result<Option<TenantRow>> {
    let stmt = db
        .0
        .prepare(&format!(
            "UPDATE tenants \
             SET business_name = ?1, tenant_name = ?2, email = ?3, \
                 updated_timestamp = CURRENT_TIMESTAMP \
             WHERE tenant_id = ?4 RETURNING {}",
            SELECT_COLS
        ))
        .bind(&[
            business_name.into(),
            tenant_name.into(),
            email.into(),
            tenant_id.into(),
        ])?;
    let result = SendFuture::new(stmt.all()).await?;
    let mut rows = result.results::<TenantRow>()?;
    Ok(rows.pop())
}

pub async fn delete_tenant(
    db: &SendWrapper<D1Database>,
    tenant_id: &str,
) -> worker::Result<bool> {
    #[derive(Deserialize)]
    struct IdRow {
        #[allow(dead_code)]
        tenant_id: String,
    }
    let stmt = db
        .0
        .prepare("DELETE FROM tenants WHERE tenant_id = ?1 RETURNING tenant_id")
        .bind(&[tenant_id.into()])?;
    let result = SendFuture::new(stmt.all()).await?;
    let rows = result.results::<IdRow>()?;
    Ok(!rows.is_empty())
}
