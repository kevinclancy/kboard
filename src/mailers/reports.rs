#![allow(non_upper_case_globals)]

use include_dir::Dir;
use loco_rs::{app::AppContext, mailer::{self, Mailer}};
use serde_json::json;
use loco_rs::prelude::*;
use chrono::NaiveDate;

static daily_activity_report: Dir<'_> = include_dir!("src/mailers/reports/daily_activity");

pub struct ReportArgs {
  pub date: NaiveDate,
  pub users_registered: u64
}

pub struct AdminReportMailer {}
impl Mailer for AdminReportMailer {}
impl AdminReportMailer {
    /// Sending welcome email the the given user
    pub async fn send_daily_activity(ctx: &AppContext, args: &ReportArgs) -> Result<()> {
        Self::mail_template(
            ctx,
            &daily_activity_report,
            mailer::Args {
                to: "kclanc@gmail.com".to_string(),
                locals: json!({
                  "date": args.date.to_string(),
                  "new_user_count": args.users_registered.to_string()
                }),
                ..Default::default()
            },
        )
        .await?;

        Ok(())
    }

}