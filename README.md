# cova-ficc-brief

`cova-ficc-brief` 是一个面向 FICC 市场的信息聚合与简报系统。

目标是：从微信公众号 RSS（或 RSS 中转）持续拉取内容，保存原文并产出摘要，向订阅者提供可消费的 RSS 源，并在每天凌晨自动生成市场简报。

说明：微信公众号没有官方原生 RSS 接口，`cova-ficc-brief` 采用第三方转换服务（当前优先 WeWe RSS）作为上游源。

## Agent Identity

- `repo`: `cova-ficc-brief`
- `expert_id`: `cova-ficc-brief`
- `display_name`: `COVA FICC Brief`

## Engineering Workflow

- Test-first mandatory workflow: [docs/development-workflow.md](./docs/development-workflow.md)

## 核心目标

1. 通过 RSS 订阅器统一接入公众号源。
2. 系统常驻服务器，按计划自动拉取和处理文章。
3. 每篇文章入库后保存原文，生成摘要，并分别发布“原文 RSS”和“摘要 RSS”。
4. 每天凌晨 4:00（Asia/Shanghai）汇总过去 24 小时文章，生成 FICC 市场简报。
5. 与 COVA 对齐：通过 COVA 接口管理任务与模型调用，支持由 COVA 托管 LLM 能力。
6. 支持长期运行部署（固定服务地址、可配置 DNS）。

## 对外服务（目标态）

1. RSS 订阅服务：对外提供公众号订阅能力与文章流。
2. 每日简报服务：按日输出当日 FICC 市场专业简报（定时任务驱动）。

## 当前已实现接口（v0）

- `GET /healthz`
- `GET /readyz`（`DATABASE_URL` 启用时会探测 Postgres 可用性）
- `POST /api/sources/wechat/link`：录入公众号文章链接并接入源
- `GET /api/sources`：查看已接入源列表
- `POST /api/sources/wechat/sync`：按已接入微信源拉取并导入文章（含去重汇总）
- `POST /api/articles/import`：导入文章（测试/回灌入口）
- `GET /api/institutions`
- `GET /api/institutions/:id/articles`
- `GET /api/articles/:id`
- `POST /api/subscribers`
- `GET /api/subscribers`
- `POST /api/subscriptions`
- `GET /api/subscribers/:id/subscriptions`
- `POST /api/rss/refresh`
- `GET /api/overview/latest`
- `POST /api/briefs/daily/run`
- `GET /api/briefs/daily/latest`
- `GET /api/wewe/status`
- `POST /api/wewe/sync`
- `GET /feeds/raw.rss`
- `GET /feeds/summary.rss`
- `GET /feeds/subscribers/:id/raw.rss`
- `GET /feeds/subscribers/:id/summary.rss`

补充说明：
- `POST /api/articles/import` 的 `summary` 字段可选；缺失时系统会基于文章内容自动生成摘要。
- 摘要与日报都支持通过 `COVA_BASE_URL`/`COVA_EXPERT_ID`/`COVA_AUTH_BEARER` 接入 COVA 托管模型。

## 当前环境变量（server）

- `DATABASE_URL`：设置后自动使用 Postgres `wechat_sources` 存储
- `DAILY_BRIEF_ENABLE_SCHEDULER`：是否启用 04:00 自动简报调度
- `COVA_BASE_URL`：设置后摘要与日报都走 COVA HTTP 适配器
- `COVA_EXPERT_ID`：默认 `cova-ficc-brief`
- `COVA_AUTH_BEARER`：可选，COVA 接口 Bearer Token
- `WEWE_RSS_BASE_URL`
- `WEWE_RSS_FEED_IDS`
- `WEWE_RSS_FEED_FORMAT`
- `WEWE_SYNC_INTERVAL_MINUTES`
- `WEWE_SYNC_ON_STARTUP`
- `WECHAT_SOURCE_SYNC_INTERVAL_MINUTES`：内置微信源同步间隔（分钟）
- `WECHAT_SOURCE_SYNC_ON_STARTUP`：服务启动时触发一次内置微信源同步

运行时会在启动阶段校验关键配置（`DATABASE_URL`、`COVA_BASE_URL`、`WEWE_*`、`PORT` 等），非法值会直接启动失败（fail-fast）。

服务支持 `SIGINT`/`SIGTERM` 优雅关停：先停止 HTTP 接收，再释放数据库连接。

## WeWe RSS 引入（已接入）

- 后端已增加 WeWe 适配入口：
  - `GET /api/wewe/status`
  - `POST /api/wewe/sync`
- 支持通过环境变量配置 WeWe 上游并定时同步：
  - `WEWE_RSS_BASE_URL`
  - `WEWE_RSS_FEED_IDS`（逗号分隔，如 `all,MP_WXS_xxx`）
  - `WEWE_RSS_FEED_FORMAT`（`rss|atom|json`）
  - `WEWE_SYNC_INTERVAL_MINUTES`
  - `WEWE_SYNC_ON_STARTUP`
- 详细部署与接入说明见：[docs/wewe-rss-integration.md](./docs/wewe-rss-integration.md)

## 生产部署

- 后端镜像构建文件：[server/Dockerfile](./server/Dockerfile)
- 生产 compose 栈（Server + Postgres）：[infra/prod/docker-compose.yml](./infra/prod/docker-compose.yml)
- 部署说明：[infra/prod/README.md](./infra/prod/README.md)
- 生产运行指南：[docs/production-deployment.md](./docs/production-deployment.md)

## 当前完成度评估（截至 2026-03-05）

当前仓库仍是 POC，但已具备核心链路雏形。

- 已有能力：
  - 公众号链接录入、源列表、按源同步采集（含去重）。
  - 文章导入后自动摘要（本地或 COVA），并可按机构查询。
  - 对外提供原文 RSS、摘要 RSS、订阅者范围 RSS。
  - 订阅者与订阅关系管理（API 级）。
  - 每日简报手动触发、latest 查询、04:00 调度守卫。
  - 支持内置微信源定时同步（启动触发与间隔触发）。
  - WeWe 适配状态与手动同步入口。
- 关键缺口：
  - 文章、订阅者、订阅关系仍是内存存储（重启丢失）。
  - 缺少任务队列、失败重试、采集/摘要作业审计。
  - 微信采集仍需增强（多文章抓取、增量游标、风控策略）。
  - COVA 目前是直连适配，未接入完整任务编排与治理。
  - 无生产级部署/监控/告警/备份方案。

粗略完成度（考虑微信 RSS 真实约束后）：约 35%-45%。

## 结论：改造还是重建

建议：在当前仓库内进行“后端重建式改造”，而不是继续在现有内存 POC 上缝补。

- 前端页面可少量复用（文章浏览与简报展示）。
- 后端建议按新架构分层重建：采集、存储、摘要、分发、定时、COVA 适配。
- 这样风险最低，也更容易满足长期运行与可运维要求。

## 里程碑建议

### M1：可运行数据底座

- 落地数据库（文章、订阅源、订阅者、任务）。
- 公众号 RSS 定时抓取（服务器常驻）。
- 原文入库与去重。

### M2：内容加工与分发

- 摘要生成流水线（可先规则/小模型，后接 COVA）。
- 输出两类 RSS：原文 RSS、摘要 RSS。
- 订阅者交付与权限控制。

### M3：日报与 COVA 对接

- 凌晨 4:00 日报任务（汇总过去 24 小时）。
- 对接 COVA 任务接口与模型托管策略。
- 增加可观测性、重试、告警与运维面板。

## 致谢与许可

本项目的微信内容 RSS 化能力依赖 `wewe-rss` 开源项目思路与接口约定，感谢原作者与社区贡献者。

- Upstream: https://github.com/cooderl/wewe-rss
- License: MIT（允许修改、再发布与商用，但需保留版权与许可声明）
- 本项目第三方许可说明见：[docs/third-party-notices.md](./docs/third-party-notices.md)
