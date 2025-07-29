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
            // inject-above (do not remove this comment)
        ]
    }
}