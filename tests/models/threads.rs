use insta::{assert_debug_snapshot, assert_yaml_snapshot};
use kboard::{
    app::App,
    models::threads::Model as ThreadsModel,
    models::threads::Entity as ThreadsEntity
};
use loco_rs::testing::prelude::*;
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("threads");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let thread = ThreadsModel::create(
        &boot.app_context.db,
        "Car crash.".to_string(),
        1,
        2,
        "I got in a car crash and broke my jaw.".to_string()
    ).await.unwrap();

    assert_yaml_snapshot!(thread,
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

    let threads = ThreadsEntity::find_paginated(
        &boot.app_context.db,
        1,
        2000,
        0
    ).await.unwrap();

    assert_eq!(threads.len(), 4);

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
async fn test_find_paginated_some() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let threads = ThreadsEntity::find_paginated(
        &boot.app_context.db,
        1,
        2,
        0
    ).await.unwrap();

    assert_eq!(threads.len(), 2);
    assert_eq!(threads[0].title, "Startled by a chihuahua.");
    assert_eq!(threads[1].title, "Startled by a moose.");

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

    let threads = ThreadsEntity::find_paginated(
        &boot.app_context.db,
        1,
        2,
        1
    ).await.unwrap();

    assert_eq!(threads.len(), 2);
    assert_eq!(threads[0].title, "Startled by a chipmunk.");
    assert_eq!(threads[1].title, "Startled by a seagull.");

    assert_yaml_snapshot!(threads,
        {
            ".created_at" => "2025-09-04T22:17:46Z",
            ".updated_at" => "2025-09-04T22:17:46Z",
            ".last_active" => "2025-09-04T22:17:46.190572"
        }
    );
}