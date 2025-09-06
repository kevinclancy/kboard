use insta::assert_yaml_snapshot;
use kboard::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use kboard::{
    models::replies::Model as RepliesModel,
    models::replies::Entity as ReplisEntity
};

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("replies");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let reply = RepliesModel::create(
        &boot.app_context.db,
        "I've had some bad experiences with seagulls myself.".to_string(),
        1,
        2,
        Some(1)
    ).await.unwrap();

    assert_yaml_snapshot!(reply,
        {
            ".created_at" => "2025-09-04T22:17:46Z",
            ".updated_at" => "2025-09-04T22:17:46Z",
            ".last_active" => "2025-09-04T22:17:46.190572"
        }
    );
}

#[tokio::test]
#[serial]
async fn test_find_paginated_all() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let threads = ReplisEntity::find_paginated(
        &boot.app_context.db,
        1,
        2000,
        0
    ).await.unwrap();

    assert_eq!(threads.len(), 2);

    assert_yaml_snapshot!(threads,
        {
            ".created_at" => "2025-09-04T22:17:46Z",
            ".updated_at" => "2025-09-04T22:17:46Z",
            ".last_active" => "2025-09-04T22:17:46.190572"
        }
    );
}

#[tokio::test]
#[serial]
async fn test_find_paginated_second_page() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let threads = ReplisEntity::find_paginated(
        &boot.app_context.db,
        1,
        1,
        1
    ).await.unwrap();

    assert_eq!(threads.len(), 1);
    assert_eq!(threads[0].body, "Oh wow. That's terrible!".to_string());

    assert_yaml_snapshot!(threads,
        {
            ".created_at" => "2025-09-04T22:17:46Z",
            ".updated_at" => "2025-09-04T22:17:46Z",
            ".last_active" => "2025-09-04T22:17:46.190572"
        }
    );
}