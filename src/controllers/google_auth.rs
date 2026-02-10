use axum::{debug_handler, extract::Query, response::Redirect};
use loco_rs::{environment, prelude::cookie::*, prelude::*};
use serde::Deserialize;
use time::Duration;

use crate::models::users;

#[derive(Debug, Deserialize)]
struct GoogleOAuthConfig {
    client_id: String,
    client_secret: String,
    redirect_uri: String,
}

#[derive(Debug, Deserialize)]
struct GoogleCallbackParams {
    code: String,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct GoogleUserInfo {
    id: String,
    email: String,
    name: String,
}

fn get_google_config(ctx: &AppContext) -> Result<GoogleOAuthConfig> {
    let config = ctx
        .config
        .settings
        .as_ref()
        .ok_or_else(|| Error::Message("No settings in config".to_string()))?;

    let google_oauth = config
        .get("google_oauth")
        .ok_or_else(|| Error::Message("No google_oauth in settings".to_string()))?;

    serde_json::from_value(google_oauth.clone())
        .map_err(|e| Error::Message(format!("Failed to parse google_oauth config: {}", e)))
}

/// Redirects user to Google OAuth consent screen
#[debug_handler]
async fn google_login(State(ctx): State<AppContext>) -> Result<Redirect> {
    let config = get_google_config(&ctx)?;

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?\
        client_id={}&\
        redirect_uri={}&\
        response_type=code&\
        scope=openid%20email%20profile&\
        access_type=offline",
        config.client_id,
        urlencoding::encode(&config.redirect_uri)
    );

    Ok(Redirect::temporary(&auth_url))
}

/// Handles the callback from Google OAuth
#[debug_handler]
async fn google_callback(
    State(ctx): State<AppContext>,
    jar: CookieJar,
    Query(params): Query<GoogleCallbackParams>,
) -> Result<(CookieJar, Redirect)> {
    let config = get_google_config(&ctx)?;

    // Exchange code for access token
    let client = reqwest::Client::new();
    let token_response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", params.code.as_str()),
            ("client_id", config.client_id.as_str()),
            ("client_secret", config.client_secret.as_str()),
            ("redirect_uri", config.redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| Error::Message(format!("Failed to exchange code: {}", e)))?;

    if !token_response.status().is_success() {
        let error_text = token_response.text().await.unwrap_or_default();
        tracing::error!(error = error_text, "Google token exchange failed");
        return Err(Error::Message("Failed to authenticate with Google".to_string()));
    }

    let token_data: GoogleTokenResponse = token_response
        .json()
        .await
        .map_err(|e| Error::Message(format!("Failed to parse token response: {}", e)))?;

    // Get user info from Google
    let user_info_response = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(&token_data.access_token)
        .send()
        .await
        .map_err(|e| Error::Message(format!("Failed to get user info: {}", e)))?;

    if !user_info_response.status().is_success() {
        return Err(Error::Message("Failed to get user info from Google".to_string()));
    }

    let user_info: GoogleUserInfo = user_info_response
        .json()
        .await
        .map_err(|e| Error::Message(format!("Failed to parse user info: {}", e)))?;

    // Find or create user
    let user = users::Model::find_or_create_from_google(
        &ctx.db,
        &user_info.id,
        &user_info.email,
        &user_info.name,
    )
    .await?;

    // Check if user is banned
    if user.is_banned {
        return Err(Error::Message("Account has been banned".to_string()));
    }

    // Generate JWT
    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .map_err(|_| Error::Message("Failed to generate token".to_string()))?;

    // Set cookies
    let is_development = ctx.environment == environment::Environment::Development;

    let jwt_cookie = Cookie::build(("jwt", token.clone()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(true);

    let username_cookie = Cookie::build(("username", user.name.clone()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(false);

    let is_moderator_cookie = Cookie::build(("is_moderator", user.is_moderator.to_string()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(false);

    tracing::info!(
        user_pid = user.pid.to_string(),
        user_email = user.email,
        "User logged in via Google OAuth"
    );

    Ok((
        jar.add(jwt_cookie).add(username_cookie).add(is_moderator_cookie),
        Redirect::temporary("/"),
    ))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/google", get(google_login))
        .add("/google/callback", get(google_callback))
}
