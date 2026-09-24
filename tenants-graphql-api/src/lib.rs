use async_graphql::{EmptySubscription, Schema};
use http::StatusCode;
use http_body_util::BodyExt;
use worker::send::SendWrapper;
use worker::*;

mod errors;
mod schema;
mod tenants;
mod validation;

use schema::{MutationRoot, QueryRoot};

#[event(fetch)]
async fn fetch(req: HttpRequest, env: Env, _ctx: Context) -> Result<HttpResponse> {
    let path = req.uri().path().to_string();
    let method = req.method().clone();

    if path != "/graphql" {
        return Ok(http::Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::empty())?);
    }

    if method != http::Method::POST {
        return Ok(http::Response::builder()
            .status(StatusCode::METHOD_NOT_ALLOWED)
            .body(Body::empty())?);
    }

    let body_bytes = req
        .into_body()
        .collect()
        .await
        .map_err(|e| Error::RustError(e.to_string()))?
        .to_bytes();

    let gql_req: async_graphql::Request = match serde_json::from_slice(&body_bytes) {
        Ok(r) => r,
        Err(_) => {
            let body = json_body(r#"{"errors":[{"message":"Invalid JSON body"}]}"#)?;
            return Ok(http::Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("content-type", "application/json")
                .body(body)?);
        }
    };

    let db = env.d1("DB")?;
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(SendWrapper(db))
        .finish();

    let gql_response = schema.execute(gql_req).await;
    let response_json =
        serde_json::to_string(&gql_response).map_err(|e| Error::RustError(e.to_string()))?;

    Ok(http::Response::builder()
        .status(StatusCode::OK)
        .header("content-type", "application/json")
        .body(json_body(&response_json)?)?)
}

fn json_body(s: &str) -> Result<Body> {
    let bytes = s.as_bytes().to_vec();
    Body::from_stream(futures_util::stream::once(futures_util::future::ready(
        Ok::<Vec<u8>, worker::Error>(bytes),
    )))
}