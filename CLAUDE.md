# CLAUDE.md

给 AI 编码助手的项目指引。**唯一事实源是 `docs/ARCHITECTURE.md`**，本文件只提供常用命令与硬约束。文档冲突时以 ARCHITECTURE.md 为准。

## 常用命令

```bash
pnpm dev              # 开发服务器 (vite, :3000)
pnpm build            # 生产构建
pnpm preview          # 预览生产构建
pnpm start            # 生产服务器 (bun run server.ts)
pnpm lint             # ESLint
pnpm typecheck        # 生成路由树 + tsc --noEmit
pnpm test             # Vitest
pnpm test:coverage    # Vitest + 覆盖率
pnpm format           # Prettier
pnpm baseline         # 质量基线：lint + typecheck + test + build（CI 同款）
```

数据库：

```bash
pnpm db:merge         # 合并 db/prisma/schema/*.part -> db/prisma/schema.prisma
pnpm db:gen           # db:merge + prisma generate
pnpm db:migrate       # db:merge + prisma migrate dev
pnpm db:deploy        # db:merge + prisma migrate deploy（生产）
pnpm db:seed          # 种子数据
```

不存在 `pnpm check-types`，用 `pnpm typecheck`。不存在 `pnpm deps`。

## 技术栈

- **框架**：TanStack Start + TanStack Router（文件路由，全类型安全）
- **UI**：React 19 + Radix UI + shadcn/ui + Tailwind CSS v4
- **数据**：TanStack Query（服务端状态）
- **表单**：React Hook Form + Zod
- **ORM**：**Prisma 7 + PostgreSQL**（`@prisma/adapter-pg`）。项目不使用 Drizzle，也不要引入第二个 ORM
- **认证**：Better Auth + RBAC（admin / superadmin）
- **国际化**：i18next（本地 JSON + 数据库 `Translation` 运行时覆盖）
- **运行时**：生产用 Bun（`bun run server.ts`），PM2 托管

## 目录结构

```
src/
├── routes/           # 文件路由（TanStack Router 约定，routeTree.gen.ts 自动生成勿手改）
│   ├── __root.tsx    # 根路由：Provider 注入 + 用户信息获取
│   ├── _authenticated/   # 需登录
│   │   └── admin/        # 需 admin/superadmin 角色
│   ├── (auth)/ (public)/ (errors)/
│   ├── api/          # HTTP 端点（数量很少，业务走 Server Functions）
│   └── m/            # 移动端路由
├── modules/          # 业务模块，按领域垂直拆分
│   └── <module>/
│       ├── module.ts     # 模块契约：defineModule({ key, dependencies, exports })
│       ├── features/     # 页面级功能
│       └── shared/       # services / server-fns / hooks / components（仅服务端逻辑放 services）
├── components/       # 全局共享组件（ui/ 为 shadcn 原始位）
├── shared/           # 跨模块共享：lib / hooks / context / utils / server-fns
├── infrastructure/   # 配置、数据库连接、可观测性（不属于任何业务模块）
├── core/             # module-registry、event-bus（模块体系内核）
├── i18n/             # 国际化配置与本地语言包
└── styles/           # 全局样式
```

`src/generated/prisma/` 与 `src/routeTree.gen.ts` 均为生成产物，禁止手改。

## 硬约束（违反会被 lint / 测试 / 评审拦下）

1. **数据访问只能落在 service 层**。组件、hook、路由里禁止直接 `getDb()` / `getDbSync()`。
2. **数据流单向**：`View → Hook → useQuery → ServerFn → Service → DB`。不要反向依赖，不要跳过 service。
3. **所有输入用 Zod 校验**：Server Function 入参、API 路由 query/body 都要过 schema。
4. **Query Key 必须来自 `src/shared/lib/query-keys.ts`**，不要在组件里手写数组 key。
5. **管理端接口必须包 `withAdminAuth()`**，普通登录接口包 `withAuth()`（见 `src/middleware.ts`）。
6. **模块间引用必须声明依赖**：在 `module.ts` 的 `dependencies` 里写清目标模块 key，否则 `module-boundaries.test.ts` 会失败。禁止从 `features/` 直接 import 另一个模块的 `features/`。
7. **新模块必须注册**：在 `src/modules/index.ts` 的 `createModuleRegistry([...])` 中登记，否则不受边界约束。
8. **日期序列化为 ISO 字符串**再传给客户端。
9. **路径别名**用 `~/` 或 `@/`（都指向 `src/`），不要写深层相对路径 `../../../`。
10. **server-fns 目录只允许服务端代码**，不要把浏览器 API 放进去。

## 已知技术债（新增代码时请避开）

- **`modules/admin` 处于拆分中**：它目前承载了用户、组织、权限、导航、系统配置五个子域。新功能**不要**再往 `modules/admin/features/` 里加，优先新建或扩展平级模块（见 `docs/ARCHITECTURE-REVIEW-2026-09.md`）。
- `src/middleware.ts` 的 `withAuth` / `withAdminAuth` 存在大量重复代码，计划合并为工厂函数；在此之前新增中间件请复用而非再抄一份。
- `db/prisma/migrations/` 是早期 SQLite 迁移残留，**当前生效的是 `db/prisma/migrations_pg/`**。不要在旧目录新增迁移。
- 生产环境不要开启 `log.requestBody.enabled`（会记录请求体入库）。

## 环境配置

必需（`.env`，见 `.env.example`）：

```bash
BETTER_AUTH_SECRET=    # 至少 32 字符
BETTER_AUTH_URL=       # 默认 http://localhost:3000
DATABASE_URL=          # PostgreSQL 连接串
```

运行时校验见 `src/shared/lib/env.ts`；启动时 `server.ts` 的 `validateStartupConfig()` 会拦截缺失项。

## 命名约定

- 组件：PascalCase（`AdminUsersTable.tsx`）
- 文件/目录：kebab-case（`user-service.ts`），路由文件名同样 kebab-case
- Hook：`use` 前缀 camelCase（`useAdminUsers.ts`）
- 服务：`<domain>.service.ts`，导出纯函数
