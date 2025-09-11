use crate::models::users::{Entity as UserEntity, Model as User};
use axum::{debug_handler, extract::Path, Json};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct UpdateUserRequest {
    name: String,
}

/// Update a user's name
#[debug_handler]
async fn update_user(
    auth: auth::JWT,
    Path(user_id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Response> {
    let current_user = User::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    // Users can only update their own profile
    if current_user.id != user_id {
        return Err(loco_rs::Error::Unauthorized("You can only update your own profile".to_string()));
    }
    
    // Find the user to update
    let user = UserEntity::find_by_id(user_id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| loco_rs::Error::NotFound)?;
    
    // Update the user's name
    use sea_orm::{ActiveModelTrait, Set};
    let mut active_user: crate::models::users::ActiveModel = user.into();
    active_user.name = Set(req.name);
    active_user.update(&ctx.db).await?;
    
    format::json(serde_json::json!({"success": true}))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/users/")
        .add("/{user_id}", patch(update_user))
}