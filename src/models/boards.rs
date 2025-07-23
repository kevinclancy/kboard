use sea_orm::entity::prelude::*;
pub use super::_entities::boards::{self, ActiveModel, Model, Entity};
use loco_rs::prelude::*;
pub type Boards = Entity;

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
    /// Find all boards
    pub async fn find_all(db: &DatabaseConnection) -> ModelResult<Vec<Self>> {
        let boards = Entity::find().all(db).await?;
        Ok(boards)
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
