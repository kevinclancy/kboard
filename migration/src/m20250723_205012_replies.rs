use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "replies",
            &[

            ("id", ColType::PkAuto),
            ("body", ColType::Text),
            ],
            &[
            ("reply?", "reply_to"),
            ("thread", ""),
            ("user", "poster"),
            ]
        ).await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "replies").await
    }
}
