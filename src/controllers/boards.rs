use crate::models::{boards::Model as Board, threads::Entity as ThreadEntity, threads::ThreadWithPosterName, threads::Model as Thread, replies::Entity as ReplyEntity};
use axum::{debug_handler, extract::Path, extract::Query, Json};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ThreadsQuery {
    page_size: Option<u64>,
    page_number: Option<u64>,
}

#[derive(Deserialize)]
struct RepliesQuery {
    page_size: Option<u64>,
    page_number: Option<u64>,
}

#[derive(Serialize)]
struct RepliesResponse {
    replies: Vec<crate::models::replies::ReplyResponse>,
    total_count: u64,
    thread_title: String,
}

#[derive(Deserialize)]
struct CreateThreadRequest {
    title: String,
    initial_reply_text: String,
}

#[derive(Serialize)]
struct CreateThreadResponse {
    thread_id: i32,
}

#[derive(Serialize)]
struct ThreadsResponse {
    threads: Vec<ThreadWithPosterName>,
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

/// Get replies for a specific thread with pagination
#[debug_handler]
async fn get_replies(
    Path((board_id, thread_id)): Path<(i32, i32)>,
    Query(params): Query<RepliesQuery>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let page_size = params.page_size.unwrap_or(10).max(1).min(100); // Default 10, max 100
    let page_number = params.page_number.unwrap_or(0);

    let replies = ReplyEntity::find_paginated(&ctx.db, thread_id, page_size, page_number).await?;

    // Get the thread to fetch num_replies
    let thread = ThreadEntity::find_by_id(thread_id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| loco_rs::Error::NotFound)?;

    let response = RepliesResponse {
        replies,
        total_count: thread.num_replies as u64,
        thread_title: thread.title,
    };

    format::json(response)
}

/// Create a new thread in a board
#[debug_handler]
async fn create_thread(
    auth: auth::JWT,
    Path(board_id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(req): Json<CreateThreadRequest>,
) -> Result<Response> {
    let user = crate::models::users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;

    let thread = Thread::create(
        &ctx.db,
        req.title,
        board_id,
        user.id,
        req.initial_reply_text,
    ).await?;

    let response = CreateThreadResponse {
        thread_id: thread.id,
    };

    format::json(response)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/boards/")
        .add("/", get(list))
        .add("/{id}/threads", get(get_threads))
        .add("/{id}/threads", post(create_thread))
        .add("/{board_id}/threads/{thread_id}/replies", get(get_replies))
}