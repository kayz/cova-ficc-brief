# WeWe RSS Local Stack

## Quick Start

1. 复制配置文件：
   - `cp .env.example .env`
2. 修改 `.env` 中的强密码和 `AUTH_CODE`。
3. 启动服务：
   - `docker compose up -d`
4. 打开 `http://127.0.0.1:4000` 完成账号绑定与公众号源配置。

## 说明

- `wewe-rss` 建议使用组织内自维护镜像，而非直接依赖 `latest`。
- `cova-ficc-brief` 服务通过 `WEWE_RSS_BASE_URL` 指向该服务地址并拉取 feed。
