# Production Deployment Guide

## Minimum topology

1. One Linux VM (public IP).
2. Docker + Docker Compose.
3. Domain A record pointing to VM.
4. Reverse proxy (Nginx/Caddy) terminating TLS in front of `:3000`.

## Deployment steps

1. Prepare runtime env from `infra/prod/.env.example`.
2. Start stack via `infra/prod/docker-compose.yml`.
3. Check `GET /healthz` and `GET /readyz`.
4. Configure reverse proxy and TLS.
5. Enable log collection and alerting.

## Required operations baseline

1. Daily DB backup for Postgres volume.
2. Alert on `/readyz != 200`.
3. Alert on container restart loops.
4. Keep image update and security patch cadence (weekly/monthly).
