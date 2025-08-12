use chrono::Utc;
use kboard::{app::App, models::{_entities::{replies, threads}, boards}};
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

//     let new_board = boards::ActiveModel {
//         title: Set("Wired Jaw Cuisine and Hygiene".to_string()),
//         description: Set(
// "Share smoothie recipes and discuss proper Waterpik technique.".to_string()),
//         ..Default::default()
//     };

//     new_board.insert(&ctx.db).await.unwrap();


    //     let new_board = boards::ActiveModel {
    //         title: Set("Lingering Symptoms".to_string()),
    //         description: Set(
    // "Discuss the tension, clicking, and occasional pain that can persist a year or more out after breaking our jaws.".to_string()),
    //         ..Default::default()
    //     };

    //     new_board.insert(&ctx.db).await.unwrap();

//     let new_board = boards::ActiveModel {
//         title: Set("Complications and treatments".to_string()),
//         description: Set(
// "Severe TMJ disorders can sometimes follow recovery from fractured jaws. Discuss such complications here, as well as potential treatments such as botox injections and jaw replacements.".to_string()),
//         ..Default::default()
//     };
//     new_board.insert(&ctx.db).await.unwrap();

    let new_board = boards::ActiveModel {
        title: Set("Surgery and Recovery".to_string()),
        description: Set(
"Discuss the difficulties of living with a wired or banded-shut jaw. Or your physical therapy experiences after the wires and bands have been removed.  Or become an arm chair oral surgeon to discuss the tradeoffs of ORIF vs IMF. ".to_string()),
        ..Default::default()
    };
    new_board.insert(&ctx.db).await.unwrap();

    // let mut new_thread = threads::ActiveModel {
    //     title: Set("Attacked by a Seagull".to_string()),
    //     description: Set("This column should be removed".to_string()),
    //     board_id: Set(1),
    //     poster: Set(1),
    //     ..Default::default()
    // };
    // new_thread.last_active = Set(Utc::now().naive_utc());
    // new_thread.insert(&ctx.db).await.unwrap();

    // for i in 1..30 {
    //     let _ = kboard::models::threads::Model::create(
    //         &ctx.db,
    //         format!("thread {i}"),
    //         1,
    //         1,
    //         "this is such a great thread. welcome to the thread.".to_string()
    //     ).await?;
    // }


    Ok(())
}
