use loco_rs::prelude::*;
use crate::models::users::{Entity as UserEntity};
use crate::mailers::reports::{AdminReportMailer, ReportArgs};
use chrono::offset::Local;

pub struct ActivityReport;
#[async_trait]
impl Task for ActivityReport {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "activity_report".to_string(),
            detail: "Task generator".to_string(),
        }
    }
    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        tracing::info!("Starting activity report task");

        let user_count = UserEntity::count_created_yesterday(&ctx.db).await?;
        tracing::info!("User count retrieved: {}", user_count);

        tracing::info!("Attempting to send email...");
        AdminReportMailer::send_daily_activity(ctx, &ReportArgs {
            date: Local::now().date_naive().pred_opt().unwrap(),
            users_registered: user_count
        }).await?;

        tracing::info!("Email sent successfully");
        Ok(())
    }
}
