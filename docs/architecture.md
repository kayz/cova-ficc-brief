# cova-ficc-brief Architecture (Target v1)

## 1. 范围与目标

`cova-ficc-brief` 目标是构建一个长期运行的 FICC 信息系统：

- `expert_id`: `cova-ficc-brief`
- `display_name`: `COVA FICC Brief`

1. 从微信公众号 RSS（或 RSS 中转）持续拉取文章。
2. 保存原文并生成摘要。
3. 按订阅者输出两类 RSS：原文源、摘要源。
4. 每天凌晨 4:00（Asia/Shanghai）产出过去 24 小时市场简报。
5. 与 COVA 对接，由 COVA 管理任务接口与 LLM 执行能力。

重要前提：微信公众号不存在官方原生 RSS。系统必须通过第三方转换源接入（当前默认 WeWe RSS）。

## 2. 当前实现与差距

当前代码仅为 POC：

- Express 内存存储（`institutions/articles/overview`）。
- 手动 `POST /api/rss/refresh` 拉取。
- 无持久化、无调度、无订阅者、无 COVA 对接。

结论：现状与目标差距大，后端需要重建式改造。

## 3. 目标架构

```text
RSS Sources (WeChat via RSS)
        |
        v
Source Adapters
- WeWe RSS Adapter (primary)
- Generic RSS Adapter (fallback)
        |
        v
Ingestion Scheduler (server cron / queue)
        |
        v
Article Pipeline
- fetch & normalize
- deduplicate
- save raw content
- summarize
        |
        +------------------+
        |                  |
        v                  v
Raw RSS Feed Service   Summary RSS Feed Service
        |
        v
Daily Brief Job (04:00 Asia/Shanghai)
- aggregate last 24h
- generate ficc report
        |
        v
COVA Adapter
- submit/query job
- model execution via COVA-managed LLM
```

## 4. 核心组件

### 4.1 Source Adapters

- 适配上游 RSS 转换系统（优先 WeWe RSS）。
- 统一不同来源的拉取协议、认证与健康状态。
- 建议保留自维护 fork 能力，应对上游停止维护风险。

### 4.2 Ingestion Scheduler

- 定时拉取各公众号 RSS。
- 失败重试与抓取日志。
- 支持手动触发补拉。

### 4.3 Article Store

- 持久化存储文章原文、元数据、去重哈希。
- 建议使用 Postgres（后续可扩展对象存储保存原文快照）。

### 4.4 Summary Pipeline

- 每篇文章入库后触发摘要任务。
- 摘要结果与原文建立关联。
- 失败任务可重试。

### 4.5 RSS Delivery

- 提供原文 RSS 输出。
- 提供摘要 RSS 输出。
- 可按订阅者或频道生成独立 feed。

### 4.6 Daily Brief Worker

- 每天 04:00 汇总最近 24 小时文章。
- 形成结构化 FICC 报告并归档。
- 支持回溯重跑。

### 4.7 COVA Adapter

- 与 COVA 任务接口对齐。
- 摘要与日报汇总可以提交给 COVA 管理的模型执行。
- 返回结果需保留来源信息与时间边界。

## 5. 数据模型（建议）

- `sources`：公众号/RSS 源配置。
- `source_adapters`：适配器配置与健康状态（如 `wewe`）。
- `subscribers`：订阅者信息。
- `subscriptions`：订阅关系（订阅者与源/频道）。
- `articles`：原文、发布时间、来源、hash。
- `article_summaries`：文章摘要。
- `daily_briefs`：日报内容与生成时间。
- `jobs`：采集/摘要/日报任务状态。

## 6. 运行与部署

- 服务部署在固定服务器地址。
- DNS 可手动配置到服务入口。
- 必备运维项：健康检查、任务监控、错误告警、日志留存、备份恢复。

## 7. 实施建议（不是从零新仓库，而是仓内重建后端）

1. 保留前端展示骨架。
2. 新建后端模块（存储、调度、任务、分发、COVA 适配）。
3. 逐步下线旧的内存 API。

这样可降低切换风险，同时满足长期运行目标。
