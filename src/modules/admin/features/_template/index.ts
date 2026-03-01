/**
 * Feature Module: [FeatureName]
 *
 * 标准 Feature 目录结构（自包含模式）:
 *
 * feature-name/
 * ├── components/           # UI 组件
 * │   ├── xxx-columns.tsx       # 表格列定义
 * │   ├── xxx-table.tsx         # 数据表格
 * │   ├── xxx-mutate-dialog.tsx # 新增/编辑弹窗
 * │   ├── xxx-delete-dialog.tsx # 删除确认弹窗
 * │   ├── xxx-primary-buttons.tsx # 顶部操作按钮
 * │   ├── xxx-dialogs.tsx       # 弹窗聚合
 * │   ├── data-table-row-actions.tsx   # 行操作
 * │   └── data-table-bulk-actions.tsx  # 批量操作
 * │
 * ├── data/                 # 数据定义
 * │   └── schema.ts             # Zod Schema + 类型定义
 * │
 * ├── hooks/                # React Query hooks（客户端）
 * │   └── use-xxx-query.ts      # Query/Mutation hooks
 * │
 * ├── services/             # Service 层（服务端，数据库操作）
 * │   └── xxx.service.ts        # Prisma 数据库操作
 * │
 * ├── server-fns/           # Server Functions（服务端，RPC 接口）
 * │   └── xxx.fn.ts             # createServerFn 定义
 * │
 * ├── types/                # TypeScript 类型（可选）
 * │   └── xxx.ts                # 复杂类型定义
 * │
 * ├── utils/                # 工具函数（可选）
 * │   ├── error-handler.ts
 * │   └── table-filters.ts
 * │
 * ├── xxx-page.tsx          # 页面组件（入口）
 * └── index.ts              # Barrel exports
 *
 * === 数据流 ===
 *
 * [UI Component] → hooks/ → server-fns/ → services/ → [Database]
 *       ↑                                                    ↓
 *   data/schema.ts (Zod 验证)                        types/ (类型定义)
 *
 * === 命名约定 ===
 *
 * - 组件：PascalCase (AdminUsersTable.tsx)
 * - Hooks：camelCase, use 前缀 (useAdminUsers.ts)
 * - Server Fns：camelCase, Fn 后缀 (getUsersFn)
 * - Service：PascalCase, Service 后缀 (UserService)
 * - 页面：kebab-case, -page 后缀 (users-page.tsx)
 */

// Export page component
// export { default as FeaturePage } from './feature-page'

// Export schemas/types
// export * from './data/schema'
