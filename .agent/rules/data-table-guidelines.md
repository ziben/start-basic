# Admin Data Table Best Practices & Guidelines

这份指南总结了在管理后台（Admin）中创建或重构数据表格（Data Table）时的最佳实践和标准规范。当需要新增业务表格或重构老旧表格时，请遵循以下核心原则。

## 1. 核心组件依赖：使用 `DataTable`

所有后台表格**必须**使用共享抽象的 `DataTable` 组件，而不是基础的 `<Table>` 标签。
```tsx
import { DataTable } from '@/components/data-table'
```
**目的**：统一骨架屏伪渲染、空数据占位、列宽无缝调整、原生数据虚拟化（Virtualization）支持等样板代码。

### 必填与推荐的 Props：
```tsx
<DataTable
  table={table}                          // TanStack React Table 实例
  columnsLength={columns.length}         // 当前列总数（用于计算骨架屏跨度）
  isLoading={isLoading}                  // 统一从外层传入查询加载状态
  skeletonCount={pagination.pageSize}    // 骨架屏占位行数（推荐使用当前分页数）
  emptyState={t('common.noResults')}     // 无数据占位文案
/>
```

## 2. 性能与长列表支持：数据虚拟化

对于行数较多或需要支持一次性加载大量数据的表格（如 `users` 列表），应该开启**行虚拟化（Row Virtualization）**。
- 需要使用 `@tanstack/react-virtual` 的 `useVirtualizer`。
- 将生成的 `rowVirtualizer` 和 `tableContainerRef` 注入到 `DataTable` 组件中。
- `DataTable` 将在底层自动接管上下边距（Padding）占位与可视区内行的精确渲染。

## 3. 列样式调整与 `meta` 扩展

对于指定特殊列样式（靠右对齐、占位宽度等），禁止直接硬编码，**必须**利用 TanStack Table 的 `meta` 属性定义。
- 允许在列的定义中设置 `meta.className`、`meta.thClassName` 或 `meta.tdClassName`。
- `DataTable` 会利用 `cn()` 自动合并列容器的 class。
- **自动宽度列（如操作栏）**：请将操作栏的 `id` 始终命名为 `'actions'`，`DataTable` 会对其应用 `width: 'auto'` 避免操作按钮发生折叠或挤压。
- **可拖拽列宽**：只要在对应列上启用 `enableResizing: true`（配合表级 `columnResizeMode: 'onChange'`），`DataTable` 会自动生成原生的拖拽句柄（Handle）。

## 4. 状态持久化：URL State 

管理后台的路由分享极其重要。所有的表格状态（翻页、过滤、排序）必须通过 URL Query 控制。
- **强制使用**项目中的 `useTableUrlState` Hook 进行双向绑定。
- 在传入 `columnFilters` 配置时，规范地补充 `serialize`（序列化） 与 `deserialize`（反序列化）逻辑，以防页面刷新时条件丢失或者导致无效的重新查询。
- （推荐）提取高度复用的解析器：如把数组中提取布尔值的逻辑沉淀到全局的 `table-filters.ts` 工具集中。

## 5. 数据交互：数据获取与乐观更新

- **请求与缓存隔离**：提取查询数据的逻辑到单独的 `use-xxx-query.ts` hook。
- **预加载下一页（Prefetching）**：对于服务端分页（Server Pagination），如果当前数据返回后判断拥有 `pageCount > pageIndex + 1`，强烈建议利用 `queryClient.prefetchQuery` 发起下一页请求预热缓存，彻底消除用户的翻页白屏等待。
- **无感操作响应（Optimistic Update）**：针对表格内行的微型操作动作（状态开启/关闭、禁用激活），请务必在 useMutation 的 `onMutate` 生命周期中实现乐观更新逻辑。

## 6. 组件文件结构建议

建议遵循以下职能单一的结构，不再把全部逻辑写在单个大文件里：
```text
模块目录/
├── pages/xxx-page.tsx             # 组装层
├── components/
│   ├── xxx-columns.tsx            # 只负责把 columns 作为 Hook 或静态变量输出
│   ├── xxx-table.tsx              # 只负责将 columns 和 API 数据装配给 `DataTable`
│   └── xxx-actions.tsx            # 对表格的操作行为及弹窗
├── utils/
│   └── table-filters.ts           # 局部的解析工具
└── hooks/
    ├── use-xxx-list-query.ts      # 提供包含了 Prefetch 特性的列表数据 Hook
    └── use-xxx-optimistic.ts      # 可选：乐观更新与单行动作封装
```
