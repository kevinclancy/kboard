use aws_sdk_s3::Client;
use tokio::sync::OnceCell;

static S3_CLIENT: OnceCell<Client> = OnceCell::const_new();

pub async fn get_client() -> &'static Client {
    S3_CLIENT
        .get_or_init(|| async {
            let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
            Client::new(&config)
        })
        .await
}

pub fn images_bucket() -> String {
    std::env::var("IMAGES_BUCKET_NAME").unwrap()
}

pub fn aws_region() -> String {
    std::env::var("AWS_REGION").unwrap()
}

pub fn public_image_url(image_key: &str) -> String {
    format!(
        "https://{}.s3.{}.amazonaws.com/{}",
        images_bucket(),
        aws_region(),
        image_key
    )
}

/// Copies an object from pending/{key} to replies/{reply_id}/image.{ext},
/// deletes the pending copy, and returns the final key.
pub async fn move_pending_to_reply(pending_key: &str, reply_id: i32) -> Result<String, String> {
    if !pending_key.starts_with("pending/") {
        return Err("Invalid pending key".to_string());
    }

    let ext = pending_key.rsplit('.').next().unwrap();
    let final_key = format!("replies/{}/image.{}", reply_id, ext);
    let bucket = images_bucket();
    let client = get_client().await;

    let copy_source = format!("{}/{}", bucket, pending_key);
    client
        .copy_object()
        .bucket(&bucket)
        .copy_source(&copy_source)
        .key(&final_key)
        .send()
        .await
        .map_err(|e| format!("S3 copy failed: {e}"))?;

    client
        .delete_object()
        .bucket(&bucket)
        .key(pending_key)
        .send()
        .await
        .map_err(|e| format!("S3 delete failed: {e}"))?;

    Ok(final_key)
}

/// Deletes an image from S3 by its key.
pub async fn delete_image(image_key: &str) -> Result<(), String> {
    let bucket = images_bucket();
    let client = get_client().await;

    client
        .delete_object()
        .bucket(&bucket)
        .key(image_key)
        .send()
        .await
        .map_err(|e| format!("S3 delete failed: {e}"))?;

    Ok(())
}
