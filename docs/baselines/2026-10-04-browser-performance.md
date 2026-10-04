# 浏览器真实性能基线（2026-10-04）

本次使用 Playwright Chromium，在 `1440x900` 视口和 Vite production preview（`localhost:4173`）测量。浏览器使用新上下文，未启用网络限速。

| 路径 | 最终地址 | 导航耗时 | FCP | 资源传输 | 结果 |
|---|---|---:|---:|---:|---|
| `/` | `/` | 2082.8 ms | 2476 ms | 353 KiB | 已测，包含 preview 首次初始化 |
| `/sign-in` | `/sign-in` | 266.6 ms | 280 ms | 66 KiB | 已测 |
| `/admin/users` | `/sign-in?redirect=...` | 113.7 ms | 100 ms | 16 KiB | 未登录重定向 |
| `/admin/ai-chat` | `/sign-in?redirect=...` | 214.6 ms | 184 ms | 16 KiB | 未登录重定向 |

登录尝试使用种子账户 `admin@example.com`，请求返回 `401`。因此本次没有把管理列表和 AI 会话的未登录重定向误报为真实登录态性能。

服务端日志同时记录了约 `213–350 ms` 的慢查询样本。该数据来自本地 preview 连接的数据库，不能直接代表生产数据库。

下一次测量需要：

1. 使用一次性管理员账户。
2. 将 `APP_URL`、`BETTER_AUTH_URL` 和浏览器地址保持一致。
3. 在已登录状态下重复 `/admin/users`、`/admin/ai-chat` 测量。
4. 保存请求瀑布、FCP、LCP、JS 执行时间和压缩传输量。

详细原始数据见 [2026-10-04-browser-performance.json](Z:/labs/start-basic/docs/baselines/2026-10-04-browser-performance.json)。
