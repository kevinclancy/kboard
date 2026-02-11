use crate::{
    models::_entities::users,
    views::auth::CurrentResponse,
};
use sea_orm::Set;
use axum::debug_handler;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct BanUserParams {
    pub user_id: i32,
}

#[debug_handler]
async fn current(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    format::json(CurrentResponse::new(&user))
}

/// Ban a user (moderator only)
#[debug_handler]
async fn ban_user(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<BanUserParams>,
) -> Result<Response> {
    let current_user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;

    if !current_user.is_moderator {
        return unauthorized("Only moderators can ban users");
    }

    let target_user = users::Entity::find_by_id(params.user_id).one(&ctx.db).await?
        .ok_or_else(|| Error::NotFound)?;

    let mut active_user: users::ActiveModel = target_user.into();
    active_user.is_banned = Set(true);
    active_user.update(&ctx.db).await?;

    format::json(())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/current", get(current))
        .add("/ban", post(ban_user))
}
