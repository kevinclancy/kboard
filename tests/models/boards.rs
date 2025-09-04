use kboard::{app::App, models};
use loco_rs::testing::prelude::*;
use serial_test::serial;
use insta::assert_debug_snapshot;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("boards");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_findall() {
    configure_insta!();

    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let boards = models::boards::Model::find_all(&boot.app_context.db).await;

    assert_debug_snapshot!(boards);
}
