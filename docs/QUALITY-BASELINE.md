# 质量与运行基线

## 发布门槛

```powershell
pnpm baseline
```

命令固定执行 lint、typecheck、test、build。每次运行把结果、耗时、提交号和工作区状态写入 `docs/baselines/*.json`；任一项失败即返回非零退出码。

## 运行指标

服务端以 JSON 行日志记录 `http_request`：`status`、`durationMs`、累计请求数和 5xx 错误率。Prisma 查询超过 200ms 记录 `slow_query`，不记录 SQL 或参数。浏览器通过原生 Performance API 上报 FCP、LCP、TTFB、LOAD 到 `/api/metrics`；请求体严格限制为 512 字节，仅接受白名单字段。

指标是单进程/单实例日志，生产环境按日志系统聚合。错误率口径为 `5xx / 总请求数`，4xx 不计为服务端错误。
