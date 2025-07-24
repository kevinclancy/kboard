use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        let _ = m
            .get_connection()
            .execute_unprepared("CREATE INDEX thread_board_active_index ON threads (board_id, last_active);")
            .await;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        let _ = m
            .get_connection()
            .execute_unprepared("DROP INDEX thread_board_active_index ON threads;")
            .await;
        Ok(())
    }
}

