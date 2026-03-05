# WeWe RSS Integration Guide

## 1. 背景

微信公众号没有官方原生 RSS 接口。`cova-ficc-brief` 通过 WeWe RSS 将微信读书侧可访问的公众号内容转换为标准 feed，再由 `cova-ficc-brief` 拉取、入库和加工。

## 2. 集成方式

`cova-ficc-brief` 不内嵌 WeWe 代码，采用“上游服务 + 本地适配器”方式：

1. 独立部署 WeWe RSS 服务（建议自维护镜像）。
2. 在 `cova-ficc-brief` 配置 WeWe 上游地址与目标 feed。
3. `cova-ficc-brief` 通过 `rss-parser` 拉取 WeWe feed，进入后续摘要/日报流程。

## 3. 推荐部署

参考仓库内样例：

- `infra/wewe-rss/docker-compose.yml`
- `infra/wewe-rss/.env.example`

建议先 fork upstream 到组织账号，再基于 fork 构建镜像并替换 compose 里的 `image`。

## 4. cova-ficc-brief 配置

在 `server` 进程环境中设置：

- `WEWE_RSS_BASE_URL`: WeWe 服务地址（如 `https://wewe.example.com`）
- `WEWE_RSS_FEED_IDS`: 逗号分隔 feed id（如 `all,MP_WXS_xxx`）
- `WEWE_RSS_FEED_FORMAT`: `rss|atom|json`（默认 `rss`）
- `WEWE_SYNC_INTERVAL_MINUTES`: 自动同步间隔分钟（`0` 表示关闭）
- `WEWE_SYNC_ON_STARTUP`: 是否启动时立即同步（`true|false`）

## 5. 当前后端接口

- `GET /api/wewe/status`: 查看 WeWe 配置与最近同步状态
- `POST /api/wewe/sync`: 立即从 WeWe 拉取一次（可传 `{ "forceUpdate": true }`）

## 6. 运行建议

1. 对 WeWe 上游做健康检查和告警（登录失效、接口限流、源失败）。
2. 控制拉取频率，避免上游风控。
3. 对采集结果做强幂等去重（source + link + publish_time）。
4. 保留可切换适配器（Generic RSS）作为降级路径。

## 7. 自维护策略

由于 upstream 更新不活跃，建议：

1. 维护组织内 fork（安全修复与兼容修复）。
2. 使用自有镜像仓库（固定 tag，不跟随 `latest`）。
3. 记录与 upstream 的差异补丁，便于后续审计与迁移。
