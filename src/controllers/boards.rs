use crate::models::{boards::Model as Board};
use axum::debug_handler;
use loco_rs::prelude::*;

/// Get all boards
#[debug_handler]
async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    let boards = Board::find_all(&ctx.db).await?;
    format::json(boards)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/boards/")
        .add("/", get(list))
}