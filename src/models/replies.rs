use sea_orm::entity::prelude::*;
use sea_orm::{QueryFilter, QueryOrder, QuerySelect, JoinType};
use serde::{Deserialize, Serialize};
pub use super::_entities::replies::{ActiveModel, Model, Entity, Column};
use crate::models::users;
pub type Replies = Entity;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyResponse {
    pub id: i32,
    pub body: String,
    /// [reply_id, reply_text, reply_status] - ID, text, and status of the reply being responded to
    pub reply_to: Option<(i32, String, i32)>,
    pub thread_id: i32,
    pub poster: i32,
    pub poster_username: String,
    pub poster_is_banned: bool,
    pub updated_at: DateTimeWithTimeZone,
    pub reply_status: i32,
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
        body: String,
        thread_id: i32,
        poster: i32,
        reply_to: Option<i32>,
    ) -> Result<Self, DbErr> {
        let reply = ActiveModel {
            body: sea_orm::ActiveValue::Set(body),
            thread_id: sea_orm::ActiveValue::Set(thread_id),
            poster: sea_orm::ActiveValue::Set(poster),
            reply_to: sea_orm::ActiveValue::Set(reply_to),
            ..Default::default()
        };

        let result = reply.insert(db).await?;

        // Update thread num_replies count
        use crate::models::threads::{Entity as ThreadEntity, Column as ThreadColumn};
        use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, Set};

        let thread = ThreadEntity::find()
            .filter(ThreadColumn::Id.eq(thread_id))
            .one(db)
            .await?
            .ok_or_else(|| DbErr::RecordNotFound("Thread not found".to_string()))?;

        let mut thread_active: crate::models::threads::ActiveModel = thread.into();
        thread_active.num_replies = Set(thread_active.num_replies.unwrap() + 1);
        thread_active.update(db).await?;

        Ok(result)
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {
    pub async fn find_paginated(
        db: &DatabaseConnection,
        thread_id: i32,
        page_size: u64,
        page_number: u64,
    ) -> Result<Vec<ReplyResponse>, DbErr> {
        use sea_orm::{ColumnTrait};

        let replies_with_data = Self::find()
            .filter(Column::ThreadId.eq(thread_id))
            .join(JoinType::InnerJoin, crate::models::_entities::replies::Relation::Users.def())
            .join_as(
                JoinType::LeftJoin,
                crate::models::_entities::replies::Relation::SelfRef.def(),
                "parent_reply"
            )
            .order_by_asc(Column::Id)
            .offset(page_size * page_number)
            .limit(page_size)
            .select_only()
            .columns([
                Column::Id,
                Column::Body,
                Column::ReplyTo,
                Column::ThreadId,
                Column::Poster,
                Column::UpdatedAt,
                Column::ReplyStatus,
            ])
            .column_as(users::users::Column::Name, "poster_username")
            .column_as(users::users::Column::IsBanned, "poster_is_banned")
            .column_as(Expr::col(("parent_reply", crate::models::_entities::replies::Column::Body)), "parent_body")
            .column_as(Expr::col(("parent_reply", crate::models::_entities::replies::Column::ReplyStatus)), "parent_status")
            .into_tuple::<(i32, String, Option<i32>, i32, i32, DateTimeWithTimeZone, i32, String, bool, Option<String>, Option<i32>)>()
            .all(db)
            .await?;

        let result = replies_with_data
            .into_iter()
            .map(|(id, body, reply_to_id, thread_id, poster, updated_at, reply_status, poster_username, poster_is_banned, parent_body, parent_status)| {
                let reply_to = match (reply_to_id, parent_body, parent_status) {
                    (Some(id), Some(text), Some(status)) => Some((id, text, status)),
                    (None, None, None) => None,
                    _ => panic!("Impossible case: reply_to_id, parent_body, and parent_status should all be Some or all be None"),
                };

                ReplyResponse {
                    id,
                    body,
                    reply_to,
                    thread_id,
                    poster,
                    poster_username,
                    poster_is_banned,
                    updated_at,
                    reply_status,
                }
            })
            .collect();

        Ok(result)
    }
}
