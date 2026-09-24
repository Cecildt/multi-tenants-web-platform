pub struct ValidatedInput {
    pub business_name: String,
    pub tenant_name: String,
    pub email: String,
}

pub fn normalize_business_name(s: &str) -> Result<String, &'static str> {
    let trimmed = s.trim();
    if trimmed.len() < 3 {
        return Err("businessName");
    }
    Ok(trimmed.to_string())
}

pub fn normalize_tenant_name(s: &str) -> Result<String, &'static str> {
    let normalized = s.trim().to_lowercase();
    if normalized.len() < 3 {
        return Err("tenantName");
    }
    Ok(normalized)
}

pub fn normalize_email(s: &str) -> Result<String, &'static str> {
    let trimmed = s.trim();
    if !is_valid_email(trimmed) {
        return Err("email");
    }
    Ok(trimmed.to_string())
}

pub fn normalize_input(
    business_name: &str,
    tenant_name: &str,
    email: &str,
) -> Result<ValidatedInput, &'static str> {
    let business_name = normalize_business_name(business_name)?;
    let tenant_name = normalize_tenant_name(tenant_name)?;
    let email = normalize_email(email)?;
    Ok(ValidatedInput {
        business_name,
        tenant_name,
        email,
    })
}

fn is_valid_email(s: &str) -> bool {
    if s.is_empty() || s.contains(char::is_whitespace) {
        return false;
    }
    let at_pos = match s.find('@') {
        Some(p) if p > 0 => p,
        _ => return false,
    };
    let domain = &s[at_pos + 1..];
    if domain.is_empty() {
        return false;
    }
    let dot_pos = match domain.rfind('.') {
        Some(p) if p > 0 => p,
        _ => return false,
    };
    let tld = &domain[dot_pos + 1..];
    tld.len() >= 2
}

#[cfg(test)]
mod tests {
    use super::*;

    // business_name tests
    #[test]
    fn business_name_too_short() {
        assert_eq!(normalize_business_name("ab").unwrap_err(), "businessName");
    }

    #[test]
    fn business_name_exact_3_chars() {
        assert!(normalize_business_name("abc").is_ok());
    }

    #[test]
    fn business_name_trims_whitespace() {
        assert_eq!(normalize_business_name("  Acme Ltd  ").unwrap(), "Acme Ltd");
    }

    #[test]
    fn business_name_too_short_after_trim() {
        assert_eq!(normalize_business_name("  ab  ").unwrap_err(), "businessName");
    }

    // tenant_name tests
    #[test]
    fn tenant_name_too_short() {
        assert_eq!(normalize_tenant_name("ab").unwrap_err(), "tenantName");
    }

    #[test]
    fn tenant_name_exact_3_chars() {
        assert!(normalize_tenant_name("abc").is_ok());
    }

    #[test]
    fn tenant_name_lowercased_and_trimmed() {
        assert_eq!(normalize_tenant_name("  AcMe  ").unwrap(), "acme");
    }

    #[test]
    fn tenant_name_too_short_after_trim() {
        assert_eq!(normalize_tenant_name("  ab  ").unwrap_err(), "tenantName");
    }

    // email tests
    #[test]
    fn email_valid() {
        assert!(normalize_email("ops@acme.test").is_ok());
    }

    #[test]
    fn email_trims_whitespace() {
        assert_eq!(
            normalize_email("  ops@acme.test  ").unwrap(),
            "ops@acme.test"
        );
    }

    #[test]
    fn email_no_at_sign() {
        assert_eq!(normalize_email("notanemail").unwrap_err(), "email");
    }

    #[test]
    fn email_no_domain_after_at() {
        assert_eq!(normalize_email("user@").unwrap_err(), "email");
    }

    #[test]
    fn email_empty_local() {
        assert_eq!(normalize_email("@domain.com").unwrap_err(), "email");
    }

    #[test]
    fn email_no_tld() {
        assert_eq!(normalize_email("user@domain").unwrap_err(), "email");
    }

    #[test]
    fn email_with_whitespace() {
        assert_eq!(normalize_email("user @domain.com").unwrap_err(), "email");
    }

    #[test]
    fn email_tld_too_short() {
        assert_eq!(normalize_email("user@domain.c").unwrap_err(), "email");
    }

    #[test]
    fn email_valid_2_char_tld() {
        assert!(normalize_email("user@domain.co").is_ok());
    }

    #[test]
    fn email_empty() {
        assert_eq!(normalize_email("").unwrap_err(), "email");
    }
}
