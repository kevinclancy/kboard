use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        add_column(m, "users", "is_moderator", ColType::BooleanWithDefault(false)).await?;
        add_column(m, "users", "is_banned", ColType::BooleanWithDefault(false)).await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        remove_column(m, "users", "is_moderator").await?;
        remove_column(m, "users", "is_banned").await?;
        Ok(())
    }
}
