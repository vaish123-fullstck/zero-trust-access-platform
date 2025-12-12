# backend/Dockerfile

# 1. Build stage
FROM golang:1.24 AS build

WORKDIR /app

# Install build deps (use apt-get on Debian/Ubuntu)
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

# Copy go mod files first
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build the binary
RUN go build -o server ./cmd/server

# 2. Runtime stage
FROM alpine:3.20

WORKDIR /app

# Add CA certs for HTTPS outbound if needed
RUN apk add --no-cache ca-certificates

COPY --from=build /app/server /app/server
COPY --from=build /app/config /app/config

ENV APP_ENV=prod
ENV APP_PORT=8080

EXPOSE 8080

CMD ["/app/server"]
