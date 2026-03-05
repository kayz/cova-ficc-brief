# Production Compose

## 1. Prepare env

```bash
cd infra/prod
cp .env.example .env
```

Fill `POSTGRES_PASSWORD` and other runtime variables before deploy.

## 2. Start services

```bash
docker compose up -d --build
```

## 3. Verify

```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/readyz
```

## 4. Stop services

```bash
docker compose down
```

Use `docker compose down -v` only when you explicitly want to remove Postgres data volume.
