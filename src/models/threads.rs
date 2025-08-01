use sea_orm::entity::prelude::*;
use sea_orm::{QueryFilter, QueryOrder, QuerySelect, Set, TransactionTrait, JoinType};
use chrono::Utc;
use serde::{Deserialize, Serialize};
pub use super::_entities::threads::{ActiveModel, Model, Entity, Column};
use crate::models::{boards, replies, users};
pub type Threads = Entity;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadWithPosterName {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub board_id: i32,
    pub poster: i32,
    pub poster_username: String,
    pub last_active: chrono::NaiveDateTime,
    pub num_replies: i32,
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert && self.updated_at.is_unchanged() {
            let mut this = self;
            this.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

// implement your read-oriented logic here
impl Model {
    pub async fn create(
        db: &DatabaseConnection,
        title: String,
        board_id: i32,
        poster_id: i32,
        initial_reply_text: String,
    ) -> Result<Model, DbErr> {
        let txn = db.begin().await?;

        // Create the thread
        let now = Utc::now();
        let thread = ActiveModel {
            title: Set(title),
            description: Set(String::new()), // Empty description for now
            board_id: Set(board_id),
            poster: Set(poster_id),
            last_active: Set(now.naive_utc()),
            num_replies: Set(1), // Starting with 1 for the initial reply
            ..Default::default()
        };

        let thread = thread.insert(&txn).await?;

        // Create the initial reply
        let reply = replies::ActiveModel {
            body: Set(initial_reply_text),
            thread_id: Set(thread.id),
            reply_to: Set(None), // 0 indicates it's a top-level reply
            poster: Set(poster_id),
            ..Default::default()
        };
        reply.insert(&txn).await?;

        // Increment the board's thread count
        let board = boards::Entity::find_by_id(board_id)
            .one(&txn)
            .await?
            .ok_or(DbErr::RecordNotFound("Board not found".to_string()))?;

        let mut board: boards::ActiveModel = board.into();
        board.num_threads = Set(board.num_threads.unwrap() + 1);
        board.update(&txn).await?;

        txn.commit().await?;

        Ok(thread)
    }
}

// implement your write-oriented logic here
impl ActiveModel { }

// implement your custom finders, selectors oriented logic here
impl Entity {
    pub async fn find_paginated(
        db: &DatabaseConnection,
        board_id: i32,
        page_size: u64,
        page_number: u64,
    ) -> Result<Vec<ThreadWithPosterName>, DbErr> {
        let threads_with_users = Self::find()
            .filter(Column::BoardId.eq(board_id))
            .join(JoinType::InnerJoin, crate::models::_entities::threads::Relation::Users.def())
            .order_by_desc(Column::LastActive)
            .offset(page_size * page_number)
            .limit(page_size)
            .select_only()
            .columns([
                Column::Id,
                Column::Title,
                Column::Description,
                Column::BoardId,
                Column::Poster,
                Column::LastActive,
                Column::NumReplies,
            ])
            .column_as(users::users::Column::Name, "poster_username")
            .into_tuple::<(i32, String, String, i32, i32, chrono::NaiveDateTime, i32, String)>()
            .all(db)
            .await?;

        let result = threads_with_users
            .into_iter()
            .map(|(id, title, description, board_id, poster, last_active, num_replies, poster_username)| {
                ThreadWithPosterName {
                    id,
                    title,
                    description,
                    board_id,
                    poster,
                    poster_username,
                    last_active,
                    num_replies,
                }
            })
            .collect();

        Ok(result)
    }

    pub async fn count_by_board(
        db: &DatabaseConnection,
        board_id: i32,
    ) -> Result<u64, DbErr> {
        Self::find()
            .filter(Column::BoardId.eq(board_id))
            .count(db)
            .await
    }
}
