use crate::models::{boards::Model as Board, threads::Entity as ThreadEntity, threads::Model as Thread};
use axum::{debug_handler, extract::Path, extract::Query};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ThreadsQuery {
    page_size: Option<u64>,
    page_number: Option<u64>,
}

#[derive(Serialize)]
struct ThreadsResponse {
    threads: Vec<Thread>,
    total_count: u64,
}

/// Get all boards
#[debug_handler]
async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    let boards = Board::find_all(&ctx.db).await?;
    format::json(boards)
}

/// Get threads for a specific board with pagination
#[debug_handler]
async fn get_threads(
    Path(board_id): Path<i32>,
    Query(params): Query<ThreadsQuery>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let page_size = params.page_size.unwrap_or(10).max(1).min(100); // Default 10, max 100
    let page_number = params.page_number.unwrap_or(0);

    let threads = ThreadEntity::find_paginated(&ctx.db, board_id, page_size, page_number).await?;
    let total_count = ThreadEntity::count_by_board(&ctx.db, board_id).await?;

    let response = ThreadsResponse {
        threads,
        total_count,
    };

    format::json(response)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/boards/")
        .add("/", get(list))
        .add("/{id}/threads", get(get_threads))
}