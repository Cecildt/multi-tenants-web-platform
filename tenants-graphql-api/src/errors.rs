use async_graphql::{Error, ErrorExtensions};

pub fn validation_error(field: &'static str) -> Error {
    Error::new("Input validation failed").extend_with(|_, e| {
        e.set("code", "BAD_USER_INPUT");
        e.set("field", field);
    })
}

pub fn db_error(original: impl std::fmt::Display) -> Error {
    #[cfg(target_arch = "wasm32")]
    worker::console_error!("D1 error: {}", original);
    #[cfg(not(target_arch = "wasm32"))]
    eprintln!("D1 error: {}", original);
    Error::new("An internal error occurred").extend_with(|_, e| {
        e.set("code", "INTERNAL_SERVER_ERROR");
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn db_error_has_no_sql_text_in_message() {
        let err = db_error("SQLITE_ERROR: no such table: tenants");
        let message = err.message.as_str();
        assert!(!message.contains("SQLITE"));
        assert!(!message.contains("no such table"));
        assert!(!message.contains("tenants"));
    }
}
