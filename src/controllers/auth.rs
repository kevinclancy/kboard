use crate::{
    mailers::auth::AuthMailer,
    models::{
        _entities::users,
        users::{LoginParams, RegisterParams},
    },
    views::auth::{CurrentResponse, LoginResponse},
};
use time::Duration;
use axum::debug_handler;
use loco_rs::{environment, prelude::{cookie::*, *}};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

pub static EMAIL_DOMAIN_RE: OnceLock<Regex> = OnceLock::new();

fn get_allow_email_domain_re() -> &'static Regex {
    EMAIL_DOMAIN_RE.get_or_init(|| {
        Regex::new(r"@example\.com$|@gmail\.com$").expect("Failed to compile regex")
    })
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ForgotParams {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResetParams {
    pub token: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MagicLinkParams {
    pub email: String,
}

/// Register function creates a new user with the given parameters and sends a
/// welcome email to the user
#[debug_handler]
async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    let res = users::Model::create_with_password(&ctx.db, &params).await;

    let user = match res {
        Ok(user) => user,
        Err(err) => {
            tracing::info!(
                message = err.to_string(),
                user_email = &params.email,
                "could not register user",
            );
            return match err {
                ModelError::EntityAlreadyExists => {
                    bad_request("There is already an account associated with this email.")
                },
                _ => {
                    bad_request(err.to_string())
                }
            };
        }
    };

    let user = user
        .into_active_model()
        .set_email_verification_sent(&ctx.db)
        .await?;

    AuthMailer::send_welcome(&ctx, &user).await?;

    format::json(())
}

/// Verify register user. if the user not verified his email, he can't login to
/// the system.
#[debug_handler]
async fn verify(
    State(ctx): State<AppContext>, 
    jar: CookieJar,
    Path(token): Path<String>
) -> Result<(CookieJar, Response)> {
    let Ok(user) = users::Model::find_by_verification_token(&ctx.db, &token).await else {
        return unauthorized("invalid token");
    };

    let verified_user = if user.email_verified_at.is_some() {
        tracing::info!(pid = user.pid.to_string(), "user already verified");
        user
    } else {
        let active_model = user.into_active_model();
        let verified_user = active_model.verified(&ctx.db).await?;
        tracing::info!(pid = verified_user.pid.to_string(), "user verified");
        verified_user
    };

    // Generate JWT and set cookies to log the user in
    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = verified_user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    // Use secure cookies only in production
    let is_development = ctx.environment == environment::Environment::Development;

    let jwt_cookie = Cookie::build(("jwt", token.clone()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(true);

    let username_cookie = Cookie::build(("username", verified_user.name.clone()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(false);

    let is_moderator_cookie = Cookie::build(("is_moderator", verified_user.is_moderator.to_string()))
        .secure(!is_development)
        .same_site(if is_development { SameSite::Lax } else { SameSite::Strict })
        .max_age(Duration::days(7))
        .path("/")
        .http_only(false);

    Ok((
        jar.add(jwt_cookie).add(username_cookie).add(is_moderator_cookie),
        format::json(LoginResponse::new(&verified_user, &token))?
    ))
}

/// In case the user forgot his password  this endpoints generate a forgot token
/// and send email to the user. In case the email not found in our DB, we are
/// returning a valid request for for security reasons (not exposing users DB
/// list).
#[debug_handler]
async fn forgot(
    State(ctx): State<AppContext>,
    Json(params): Json<ForgotParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        return format::json(());
    };

    let user = user
        .into_active_model()
        .set_forgot_password_sent(&ctx.db)
        .await?;

    AuthMailer::forgot_password(&ctx, &user).await?;

    format::json(())
}

/// reset user password by the given parameters
#[debug_handler]
async fn reset(State(ctx): State<AppContext>, Json(params): Json<ResetParams>) -> Result<Response> {
    let Ok(user) = users::Model::find_by_reset_token(&ctx.db, &params.token).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        tracing::info!("reset token not found");

        return format::json(());
    };
    user.into_active_model()
        .reset_password(&ctx.db, &params.password)
        .await?;

    format::json(())
}

/// Creates a user login and returns a token
#[debug_handler]
async fn login(
    State(ctx): State<AppContext>,
    jar: CookieJar,
    Json(params): Json<LoginParams>) -> Result<(CookieJar, Response)> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        tracing::debug!(
            email = params.email,
            "login attempt with non-existent email"
        );
        return unauthorized("Invalid credentials!");
    };

    let valid = user.verify_password(&params.password);

    if !valid {
        return unauthorized("unauthorized!");
    }

    let jwt_secret = ctx.config.get_jwt_config()?;

    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    // Use secure cookies only in production
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

    Ok((
        jar.add(jwt_cookie).add(username_cookie).add(is_moderator_cookie),
        format::json(LoginResponse::new(&user, &token))?
    ))
}

#[debug_handler]
async fn current(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    format::json(CurrentResponse::new(&user))
}

/// Magic link authentication provides a secure and passwordless way to log in to the application.
///
/// # Flow
/// 1. **Request a Magic Link**:
///    A registered user sends a POST request to `/magic-link` with their email.
///    If the email exists, a short-lived, one-time-use token is generated and sent to the user's email.
///    For security and to avoid exposing whether an email exists, the response always returns 200, even if the email is invalid.
///
/// 2. **Click the Magic Link**:
///    The user clicks the link (/magic-link/{token}), which validates the token and its expiration.
///    If valid, the server generates a JWT and responds with a [`LoginResponse`].
///    If invalid or expired, an unauthorized response is returned.
///
/// This flow enhances security by avoiding traditional passwords and providing a seamless login experience.
async fn magic_link(
    State(ctx): State<AppContext>,
    Json(params): Json<MagicLinkParams>,
) -> Result<Response> {
    let email_regex = get_allow_email_domain_re();
    if !email_regex.is_match(&params.email) {
        tracing::debug!(
            email = params.email,
            "The provided email is invalid or does not match the allowed domains"
        );
        return bad_request("invalid request");
    }

    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        tracing::debug!(email = params.email, "user not found by email");
        return format::empty_json();
    };

    let user = user.into_active_model().create_magic_link(&ctx.db).await?;
    AuthMailer::send_magic_link(&ctx, &user).await?;

    format::empty_json()
}

/// Verifies a magic link token and authenticates the user.
async fn magic_link_verify(
    Path(token): Path<String>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_magic_token(&ctx.db, &token).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        return unauthorized("unauthorized!");
    };

    let user = user.into_active_model().clear_magic_link(&ctx.db).await?;

    let jwt_secret = ctx.config.get_jwt_config()?;

    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    format::json(LoginResponse::new(&user, &token))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/register", post(register))
        .add("/verify/{token}", get(verify))
        .add("/login", post(login))
        .add("/forgot", post(forgot))
        .add("/reset", post(reset))
        .add("/current", get(current))
        .add("/magic-link", post(magic_link))
        .add("/magic-link/{token}", get(magic_link_verify))
}
