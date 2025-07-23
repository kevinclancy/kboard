use kboard::{app::App, models::_entities::boards};
#[allow(unused_imports)]
use loco_rs::{cli::playground, prelude::*};

#[tokio::main]
async fn main() -> loco_rs::Result<()> {
    let ctx = playground::<App>().await?;

//     let new_board = boards::ActiveModel {
//         title: Set("Broken Jaw Stories".to_string()),
//         description: Set(
// "Tell everyone about the time you broke your jaw. How did it happen? What were you doing in the days leading up to it? Did your hospital visits go smoothly?".to_string()),
//         ..Default::default()
//     };

//     new_board.insert(&ctx.db).await.unwrap();

    let new_board = boards::ActiveModel {
        title: Set("Wired Jaw Cuisine and Hygiene".to_string()),
        description: Set(
"Share smoothie recipes and discuss proper Waterpik technique.".to_string()),
        ..Default::default()
    };

    new_board.insert(&ctx.db).await.unwrap();

    Ok(())
}
