# backend/Dockerfile

# 1. Build stage
FROM golang:1.22-alpine AS build
WORKDIR /app

# Install build deps
RUN apk add --no-cache git

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

CMD ["/app/backend"]
