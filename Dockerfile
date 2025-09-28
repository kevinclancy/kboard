# Multi-stage build for KBoard Rust application
FROM --platform=linux/arm64 rust:latest AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    musl-tools \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add aarch64-unknown-linux-musl

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY migration ./migration

RUN mkdir -p src/bin && \
    echo "fn main() {}" > src/bin/main.rs

RUN cargo build --release --target aarch64-unknown-linux-musl && \
    rm -rf src target/aarch64-unknown-linux-musl/release/deps/kboard*

COPY src ./src

RUN cargo build --release --target aarch64-unknown-linux-musl

FROM --platform=linux/arm64 debian:bookworm

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /webserver/config /data

COPY --from=builder /app/target/aarch64-unknown-linux-musl/release/kboard-cli /webserver/kboard-cli
COPY frontend/dist /webserver/frontend/dist

COPY config/ /webserver/config/

WORKDIR /webserver

VOLUME ["/data"]

EXPOSE 5150