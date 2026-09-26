# Zi Start Basic

基于 **TanStack Start** 的全栈应用模板，内置 RBAC、管理后台、国际化、Prisma 数据库等基础能力。

## 技术栈

- **框架**：TanStack Start + TanStack Router
- **UI**：React 19 + Radix UI + Tailwind CSS v4 + shadcn/ui
- **ORM**：Prisma 7 + PostgreSQL
- **认证**：Better Auth + RBAC
- **状态管理**：TanStack Query
- **表单/校验**：React Hook Form + Zod
- **国际化**：i18next（支持数据库动态翻译）
- **运行时**：Bun（生产）+ PM2

## 目录结构

```
src/
├── routes/           # 文件路由 (TanStack Router)
├── modules/          # 核心业务模块，按领域垂直拆分
├── components/       # 全局共享组件 (ui/ 为 shadcn 原始位)
├── shared/           # 共享 hooks/utils/lib (包含 Query Keys 集中管理)
├── infrastructure/   # 运行时配置、数据库连接、可观测性
├── core/             # 模块契约内核 (module-registry, event-bus)
├── i18n/             # 国际化配置
└── styles/           # 全局样式
```

详细的项目架构、设计模式和开发规范，请参阅 [架构文档](docs/ARCHITECTURE.md)。

## 快速开始

```bash
pnpm install
pnpm db:deploy        # 应用数据库迁移
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env`，至少配置：

```bash
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/start_basic
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start            # 生产服务器 (bun)
pnpm lint
pnpm typecheck
pnpm test
pnpm baseline         # lint + typecheck + test + build
```

数据库相关：`pnpm db:merge` / `db:gen` / `db:migrate` / `db:deploy` / `db:seed`。
