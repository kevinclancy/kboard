use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "reply_statuses",
            &[

            ("id", ColType::PkAuto),

            ("name", ColType::String),
            ("description", ColType::String),
            ],
            &[
            ]
        ).await?;

        // Insert the three reply status types
        m.get_connection()
            .execute_unprepared(
                "INSERT INTO reply_statuses (id, name, description) VALUES
                (1, 'live', 'Full text is visible to all viewers'),
                (2, 'hidden', 'No evidence of the reply is visible to viewers'),
                (3, 'deleted', 'Reply box is visible with poster but body shows this reply was deleted')"
            )
            .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "reply_statuses").await
    }
}
