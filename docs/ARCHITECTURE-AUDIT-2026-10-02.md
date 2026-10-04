# 整体架构诊断与审计（2026-10-02）

核对基点：`046d906`（当前 HEAD）。

审计以当前源码、测试、构建产物、迁移配置、CI 工作流和现有架构文档为准。专家评审中的结论先与当前 HEAD 对照，再分为已修复、仍存在和需要运行环境证据三类。

## 当前基线

| 项目 | 当前核对结果 | 证据边界 |
| --- | --- | --- |
| 源码 | 714 个 `.ts/.tsx` 文件 | 排除了 generated 和 routeTree |
| admin 体量 | 209 个源码文件 | 仍是最大的业务聚合区 |
| 路由 | 72 个源码路由文件 | URL 兼容仍需保持 |
| 测试 | 47 个测试/规格文件 | admin 代码量与测试量仍不匹配 |
| 模块注册 | 10 个业务目录，5 个注册模块 | `auth/payment/health/audit/navigation` 已注册 |
| 数据库 | Prisma 7 + PostgreSQL，活动迁移为 `migrations_pg` | 本地 schema 校验通过；未完成临时 PG 回放 |
| 客户端构建 | 最大 JS 文件约 704 KiB；总 JS 约 3.27 MiB 未压缩 | 这是构建产物基线，不是用户网络瀑布 |
| 发布检查 | 当前 checkout 的 install/check/build 可复现 | 未证明远端 CI、生产迁移和回滚 |

## 已经修复或基本收口的评审项

- `src/shared/lib/env.ts` 已改为只读取显式公开的 `VITE_*` 配置，硬编码数据库连接串不再进入客户端构建；原凭据是否仍有效、是否轮换、历史和已发布资源是否清理，尚无运行环境证据。
- 未登录与无权限状态已区分为 `401` 和 `403`，ServerFn 的安全错误契约已有测试。
- 模块边界检查已覆盖注册模块的静态、动态和相对导入，并使用显式兼容白名单。
- navigation 的菜单组、菜单项、角色菜单组管理页面和角色菜单组分配 ServerFn 已归位，旧 admin 入口保留转发。
- Prisma 活动迁移目录、合并 schema 和 PostgreSQL provider 已有契约测试；`vite-plugin-inspect` 已限制为开发环境。

## 仍需优先处理的问题

### P0：管理侧边栏 ServerFn 缺少入口级鉴权

`src/modules/admin/shared/sidebar/api.fn.ts` 的 `getSidebarDataFn` 接受 `ADMIN` 参数后直接调用 `loadSidebarData`，入口没有 `requireAdmin`。`src/modules/admin/shared/sidebar/sidebar-data-loader.ts` 在 session、数据库或加载异常时，会按 scope 返回 admin fallback 数据。这样未登录调用者可以请求 admin 导航元数据；这不是后台业务数据泄露，但暴露了管理路由和菜单结构，也说明敏感范围依赖调用方页面保护而不是 ServerFn 自身保护。

修复要求：

1. `scope === 'ADMIN'` 时在 ServerFn 入口调用 `requireAdmin('LoadAdminSidebar')`。
2. 未登录或无权限时抛出标准 `UNAUTHORIZED` / `FORBIDDEN`，不能把 admin fallback 当成错误恢复结果返回。
3. APP scope 保持现有公开行为；数据库故障时只返回 APP fallback。
4. 增加未登录、普通用户、管理员三条行为测试，并断言 loader 在拒绝分支不访问数据库。

### P1：服务端配置示例仍与 PostgreSQL 事实冲突

`.env.example` 已写 PostgreSQL，但 `.env.server.example` 仍是 `DATABASE_URL=file:./db/prod.db`。新部署人员按后者配置会直接触发 PostgreSQL adapter 或迁移链错误。

修复要求：把 `.env.server.example` 改为 PostgreSQL 示例，加入 `?schema=public`，并在配置契约测试中禁止 `file:` 默认值。

### P1：admin 仍是未注册的第二应用

当前 `src/modules/index.ts` 只注册 5 个模块，`admin/ai/dashboard/mobile/settings` 仍不在 registry。边界测试现在能保护已注册模块，但不能把 admin、AI 和页面聚合模块纳入同一套声明式依赖治理。

行动顺序：

1. 完成 navigation 后，以 identity 为下一切片，先盘点 owner、ServerFn、service、hook 和兼容入口。
2. 为 identity 补 `module.ts`，注册后只迁移 users/account/session/verification 的一组消费者。
3. 每个切片保留兼容转发，跑边界测试、服务层测试和类型检查后再提交。
4. organization、rbac、system-config 依次处理；不要一次搬动整个 admin。

### P1：迁移和发布的运行环境证据仍为空

`prisma.config.ts` 已明确 `db/prisma/migrations_pg`，当前本地 schema validate、install、质量基线和 build 均通过，但没有隔离临时 PostgreSQL 的迁移回放证据。`.github/workflows/quality-baseline.yml` 只运行 `pnpm check`，没有执行迁移回放或 schema drift 检查。`scripts/deploy-preflight.ts` 的迁移状态和可选健康检查也没有在真实部署环境验收。

行动顺序：

1. 在一次性临时 PostgreSQL 数据库执行 `db:merge`、生成客户端和 `migrate deploy`。
2. 用 Prisma schema 与数据库结构做 diff，并保存迁移前后结果。
3. 在 CI 增加独立的 schema validate / migration contract 步骤；真实数据库步骤使用隔离服务，不把生产连接串放入测试日志。
4. 用错误密钥、缺迁移、错误 health URL 和超时场景验证 preflight 失败；再做一次成功路径。
5. 单独记录生产迁移、`/readyz`、应用 reload 和回滚演练证据。

### P1：性能仍停留在构建和 preview 基线

当前最大 JS 文件约 704 KiB，chat 约 489 KiB，dashboard 约 367 KiB；preview 路由请求成功，首个请求约 978 ms，后续约 19 ms，并观察到两次超过 200 ms 的慢查询。这些数据不能证明真实用户首屏性能，也不能直接证明需要 `manualChunks`。

行动顺序：

1. 用浏览器固定网络和缓存条件，测 sign-in、admin 列表、AI 会话的请求瀑布、压缩传输量、FCP/LCP 和脚本执行时间。
2. 找出首屏实际加载的 chat、dashboard、editor、chart 依赖，再做路由级动态导入。
3. 只有拆包结果稳定后，再把 `chunkSizeWarningLimit` 从 800 调回 500。
4. 对慢查询保存 query、调用路径、样本量和数据库响应时间，不因两次本地样本直接改阈值。

### P1：鉴权中间件仍有重复实现，且旧入口没有源码消费者

`src/middleware.ts` 的 `withAuth` 与 `withAdminAuth` 仍重复请求上下文、日志和审计闭包；本轮只修正了 401/403。当前源码搜索没有找到它们的业务消费者，真实 ServerFn 主要使用 `requireUser`、`requireAdmin` 和 `requirePermission`。

处理决定：先保留旧入口，补齐真实 ServerFn / API 的鉴权行为测试；只有重新确认存在消费者或明确删除授权后，再做工厂化或删除，避免为无消费者代码制造新抽象。

## 次要问题与清理顺序

- `db/prisma/migrations/` 的旧 SQLite 迁移仍保留。先做用途和归档确认，再决定是否删除；不能因为活动目录正确就直接删除历史文件。
- `.env.server.example` 是事实漂移，优先级高于清理旧迁移。
- `pnpm-lock.yaml` 中的 Drizzle 依赖来自 Better Auth 依赖链，不能仅凭名称删除；先做 direct dependency 和运行时引用核对。
- 根目录日志和调试文本没有继续扩大；当前 tracked 的 `.txt` 白名单 `public/MP_verify_*.txt` 是业务校验文件，不应按日志删除。
- UI 组件和 settings 重复路由暂不处理，先等真实消费者和浏览器基线，避免以目录数量代替收益。

## 交付门槛与排序

### 现在就做

1. 修复 admin sidebar ServerFn 的入口鉴权和 fallback 行为。
2. 修正 `.env.server.example`，补配置契约测试。
3. 保留当前 5 个提交的质量基线，重新跑 `pnpm check`。

### 下一阶段

1. 完成临时 PostgreSQL 回放和 schema diff。
2. 验证 preflight 的失败/成功矩阵和真实 `/readyz`。
3. 以 identity 为下一模块边界切片。

### 再之后

1. 用浏览器瀑布测量决定拆包。
2. 检查日志队列的积压、失败、退出 flush 和审计完整性。
3. 再评估 middleware 工厂化、settings 路由合并和旧迁移归档。

每个切片的完成条件是：代码差异、定向行为证据、lint/typecheck/test/build 结果、未验证项和 Git 提交同时记录。生产凭据轮换、数据库迁移、CI 修改、发布和回滚必须分别保留环境证据。

## 2026-10-04 执行结果

- admin sidebar 的 `ADMIN` ServerFn 已增加管理员鉴权；admin 加载失败不再返回 admin fallback。
- `.env.server.example` 已改为 PostgreSQL 连接示例。
- identity 的 users、account、session、verification 已迁移到 `src/modules/identity`，并注册 `identityModule`。
- 日志队列已限制为 5000 条；数据库写入失败时保留批次，服务关闭时执行 flush。
- `pnpm deploy:preflight` 已在当前环境通过；全量测试为 48 个文件、176 个测试通过。
- 未完成的环境证据仍包括临时 PostgreSQL 回放、远端 CI、生产发布、浏览器真实网络瀑布、凭据轮换和回滚演练。

## 2026-10-04 回放补充

- 隔离 PostgreSQL 首次回放暴露了 `20260920090000_query_indexes` 在 AI 表迁移缺失时提前创建索引的问题。
- 新增 `20260504100000_add_ai_chat_module` 后，8 个活动迁移在干净 PostgreSQL 中全部成功应用。
- 数据库与当前 Prisma schema 的 diff 仍报告历史 `zc_*` 表和 `system_config` 约束漂移。清理这些历史对象可能删除数据，必须先确认归档和回滚方案。
- preflight 成功路径通过；短密钥和不可达 health URL 的失败路径均按预期失败。
