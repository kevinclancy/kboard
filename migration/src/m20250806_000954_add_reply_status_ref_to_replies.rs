use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        // Insert the three reply status types
        m.get_connection()
            .execute_unprepared(
                "ALTER TABLE replies ADD COLUMN reply_status INTEGER NOT NULL REFERENCES reply_statuses(id) DEFAULT 1;"
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        remove_column(m, "replies", "reply_status").await?;
        Ok(())
    }
}
