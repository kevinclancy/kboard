use insta::{assert_debug_snapshot};
use kboard::{
    app::App,
    models::users,
    controllers::boards::RepliesResponse as RepliesResponse,
    controllers::boards::ThreadsResponse as ThreadsResponse
};
use loco_rs::testing::prelude::*;
use serial_test::serial;

// TODO: see how to dedup / extract this to app-local test utils
// not to framework, because that would require a runtime dep on insta
macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("board_request");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn can_get_boards() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        seed::<App>(&ctx).await.unwrap();
        let response = request.get("/api/boards").await;
        assert_eq!(
            response.status_code(),
            200,
            "Boards request should succeed"
        );

        assert_debug_snapshot!(response.text());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_threads() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        seed::<App>(&ctx).await.unwrap();
        let response = request.get("/api/boards/1/threads").await;
        assert_eq!(
            response.status_code(),
            200,
            "Threads request should succeed"
        );

        assert_debug_snapshot!(response.text());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_post_thread() {
    configure_insta!();

    let payload = serde_json::json!({
        "title": "I was startled by a Pika.",
        "initial_reply_text": "The Pika's cry caught me off guard.",
    });

    request::<App, _, _>(|request, ctx| async move {
        seed::<App>(&ctx).await.unwrap();

        // Get user1 from fixtures and generate JWT token
        let user1 = users::Model::find_by_pid(&ctx.db, "11111111-1111-1111-1111-111111111111").await.unwrap();
        let jwt_secret = ctx.config.get_jwt_config().unwrap();
        let token = user1
            .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
            .unwrap();

        let response = request
            .post("/api/boards/1/threads")
            .add_header("authorization", format!("Bearer {}", token))
            .json(&payload)
            .await;

        assert_eq!(response.status_code(), 200);

        let response_text = response.text();
        assert_debug_snapshot!(response_text);

        let response = request.get("/api/boards/1/threads/5/replies?page_size=1&page_number=0").await;
        assert_eq!(response.status_code(), 200);

        let replies_response: RepliesResponse = response.json();
        assert_eq!(replies_response.replies.len(), 1);
        assert_eq!(replies_response.replies[0].body, "The Pika's cry caught me off guard.");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_delete_thread() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        seed::<App>(&ctx).await.unwrap();

        // Get user1 from fixtures and generate JWT token
        let user1 = users::Model::find_by_pid(&ctx.db, "11111111-1111-1111-1111-111111111111").await.unwrap();
        let jwt_secret = ctx.config.get_jwt_config().unwrap();
        let token = user1
            .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
            .unwrap();

        let del_response = request
            .delete("/api/boards/1/threads/1")
            .add_header("authorization", format!("Bearer {}", token))
            .await;

        assert_eq!(del_response.status_code(), 200);


        let get_response = request.get("/api/boards/1/threads").await;
        assert_eq!(get_response.status_code(), 200);
        assert_debug_snapshot!(get_response.text());

        let threads_response: ThreadsResponse = get_response.json();
        assert!(threads_response.threads.iter().find(|t| (t.id == 1)).is_none());
    })
    .await;
}