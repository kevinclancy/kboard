#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;

mod m20250723_015415_boards;
mod m20250723_021723_threads;
mod m20250723_205012_replies;
mod m20250724_035331_add_last_active_to_threads;
mod m20250724_040020_create_thread_board_active_index;
mod m20250727_043400_add_num_threads_to_boards;
mod m20250727_044844_add_num_replies_to_threads;
mod m20250801_155826_add_replies_thread_index;
mod m20250802_225354_add_is_moderator_and_is_banned_to_users;
mod m20250802_230441_add_is_deleted_to_replies;
mod m20250802_230712_add_is_deleted_to_threads;
mod m20250804_210454_reply_statuses;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20250723_015415_boards::Migration),
            Box::new(m20250723_021723_threads::Migration),
            Box::new(m20250723_205012_replies::Migration),
            Box::new(m20250724_035331_add_last_active_to_threads::Migration),
            Box::new(m20250724_040020_create_thread_board_active_index::Migration),
            Box::new(m20250727_043400_add_num_threads_to_boards::Migration),
            Box::new(m20250727_044844_add_num_replies_to_threads::Migration),
            Box::new(m20250801_155826_add_replies_thread_index::Migration),
            Box::new(m20250802_225354_add_is_moderator_and_is_banned_to_users::Migration),
            Box::new(m20250802_230441_add_is_deleted_to_replies::Migration),
            Box::new(m20250802_230712_add_is_deleted_to_threads::Migration),
            Box::new(m20250804_210454_reply_statuses::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}