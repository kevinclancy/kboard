use sea_orm_migration::{prelude::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        let db = m.get_connection();
        let _ = db
            .execute_unprepared("CREATE INDEX replies_thread_index ON replies (thread_id);")
            .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        let _ = m
            .get_connection()
            .execute_unprepared("DROP INDEX replies_thread_index ON replies;")
            .await?;
        Ok(())
    }
}