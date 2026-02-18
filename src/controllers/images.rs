use axum::debug_handler;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

const ALLOWED_TYPES: &[&str] = &["image/jpeg", "image/png", "image/gif", "image/webp"];

#[derive(Deserialize)]
struct PresignRequest {
    content_type: String,
}

#[derive(Serialize)]
struct PresignResponse {
    upload_url: String,
    pending_key: String,
}

#[debug_handler]
async fn presign_upload(
    _auth: auth::JWT,
    State(_ctx): State<AppContext>,
    Json(req): Json<PresignRequest>,
) -> Result<Response> {
    if !ALLOWED_TYPES.contains(&req.content_type.as_str()) {
        return Err(loco_rs::Error::BadRequest(format!(
            "Unsupported content type: {}. Allowed: jpeg, png, gif, webp",
            req.content_type
        )));
    }

    let ext = match req.content_type.as_str() {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        _ => unreachable!(),
    };

    let pending_key = format!("pending/{}.{}", Uuid::new_v4(), ext);
    let bucket = crate::s3::images_bucket();
    let client = crate::s3::get_client().await;

    let presign_config = aws_sdk_s3::presigning::PresigningConfig::builder()
        .expires_in(std::time::Duration::from_secs(600))
        .build()
        .expect("valid presigning config");

    let presigned = client
        .put_object()
        .bucket(&bucket)
        .key(&pending_key)
        .content_type(&req.content_type)
        .presigned(presign_config)
        .await
        .map_err(|e| {
            tracing::error!("Failed to generate presigned URL: {e}");
            loco_rs::Error::InternalServerError
        })?;

    format::json(PresignResponse {
        upload_url: presigned.uri().to_string(),
        pending_key,
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/images")
        .add("/presign", post(presign_upload))
}
