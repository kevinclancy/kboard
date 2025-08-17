use crate::models::replies::Entity as ReplyEntity;
use axum::extract::Query;
use loco_rs::prelude::*;
use sea_orm::{QueryFilter, QuerySelect, JoinType, ColumnTrait, RelationTrait};
use sea_orm::prelude::Expr;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String, // search term
    #[serde(default = "default_limit")]
    limit: u64, // optional limit, default 50
}

fn default_limit() -> u64 {
    50
}

#[derive(Serialize)]
pub struct SearchReplyResult {
    pub reply_id: i32,
    pub reply_body: String,
    pub thread_id: i32,
    pub thread_title: String,
    pub board_id: i32,
    pub board_title: String,
    pub poster_id: i32,
    pub poster_name: String,
}

#[derive(Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchReplyResult>,
    pub total_found: usize,
}

/// Search replies by text content
pub async fn search_replies(
    Query(params): Query<SearchQuery>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    if params.q.trim().is_empty() {
        return format::json(SearchResponse {
            results: vec![],
            total_found: 0,
        });
    }

    // Build the search query with joins to get thread, board, and user info
    let search_results = ReplyEntity::find()
        .filter(crate::models::_entities::replies::Column::Body.contains(&params.q))
        .filter(crate::models::_entities::replies::Column::ReplyStatus.eq(1)) // Only search live replies
        .join(JoinType::InnerJoin, crate::models::_entities::replies::Relation::Threads.def())
        .join(JoinType::InnerJoin, crate::models::_entities::replies::Relation::Users.def())
        .join_as(
            JoinType::InnerJoin,
            crate::models::_entities::threads::Relation::Boards.def(),
            "board"
        )
        .select_only()
        .columns([
            crate::models::_entities::replies::Column::Id,
            crate::models::_entities::replies::Column::Body,
            crate::models::_entities::replies::Column::ThreadId,
        ])
        .column_as(crate::models::_entities::threads::Column::Title, "thread_title")
        .column_as(crate::models::_entities::threads::Column::BoardId, "board_id")
        .column_as(Expr::col(("board", crate::models::_entities::boards::Column::Id)), "board_id_alt")
        .column_as(Expr::col(("board", crate::models::_entities::boards::Column::Title)), "board_title")
        .column_as(crate::models::_entities::replies::Column::Poster, "poster_id")
        .column_as(crate::models::_entities::users::Column::Name, "poster_name")
        .limit(params.limit)
        .into_tuple::<(i32, String, i32, String, i32, i32, String, i32, String)>()
        .all(&ctx.db)
        .await?;

    let results: Vec<SearchReplyResult> = search_results
        .into_iter()
        .map(|(reply_id, reply_body, thread_id, thread_title, board_id, _board_id_alt, board_title, poster_id, poster_name)| {
            SearchReplyResult {
                reply_id,
                reply_body,
                thread_id,
                thread_title,
                board_id,
                board_title,
                poster_id,
                poster_name,
            }
        })
        .collect();

    let total_found = results.len();

    format::json(SearchResponse {
        results,
        total_found,
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/search/")
        .add("/replies", get(search_replies))
}