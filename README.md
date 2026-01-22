# Zi Start Basic

基于 **TanStack Start** 的全栈应用模板，内置 RBAC、管理后台、国际化、Prisma 数据库等基础能力。

## 技术栈

- **框架**：TanStack Start + TanStack Router
- **UI**：React 19 + Radix UI + Tailwind CSS v4 + shadcn/ui
- **数据库**：Prisma (LibSQL/SQLite)
- **认证**：Better Auth + RBAC
- **状态管理**：TanStack Query
- **表单/校验**：React Hook Form + Zod
- **国际化**：i18next（支持数据库动态翻译）

## 目录结构

```
src/
├── routes/           # 文件路由
│   ├── __root.tsx    # Provider + beforeLoad
│   ├── _authenticated/  # 需要登录的页面
│   ├── (public)/     # 公共页面（登录/注册）
│   └── admin/        # 管理后台
├── features/         # 业务模块
├── components/       # 公共组件
├── modules/          # 系统模块（auth/admin 等）
├── shared/           # 共享 hooks/utils/lib
├── i18n/             # 国际化
└── styles/           # 全局样式
```

## 快速开始

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env`，至少配置：

```bash
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=file:./db/dev.db
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm check-types
pnpm test
```
