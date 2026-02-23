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

## 7. 固定布局（Fixed Layout）：表头与分页始终可见

所有包含 `DataTable` 的管理后台页面**必须**使用固定布局模式，确保：
- **页面标题和工具栏**固定在顶部
- **分页控件**固定在底部，始终可见
- **只有表格内容区域**独立滚动

### 7.1 布局层级结构

整个布局的 Flex 高度约束链必须完整，任何一层断裂都会导致表格无法正确收缩：

```text
SidebarInset (h-[calc(100svh-1rem)], overflow-hidden, flex flex-col)
  └─ AppHeader (固定高度)
  └─ TabBar (固定高度)
  └─ div.flex-1.overflow-hidden
       └─ TabContent (flex flex-col, h-full)              ← 传递高度约束，不产生滚动
            └─ Main[fixed] (flex grow flex-col overflow-hidden)
                 ├─ 标题区域 (自然高度，收缩为0)
                 ├─ 表格容器 div (flex flex-1 flex-col overflow-hidden)
                 │    └─ XxxTable 组件
                 │         ├─ DataTableToolbar (固定高度)
                 │         ├─ DataTable (min-h-0 flex-1, 内部 overflow-auto)  ← 唯一滚动区域
                 │         └─ DataTablePagination (固定高度)                  ← 始终可见
                 └─ Dialogs (绝对定位，不占据流)
```

### 7.2 页面层（Page Component）标准写法

```tsx
// xxx-page.tsx
export default function XxxPage() {
  return (
    <XxxProvider>
      <AppHeaderMain fixed>   {/* ← 必须加 fixed */}
        {/* 标题区域 */}
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>页面标题</h2>
            <p className='text-muted-foreground'>页面描述</p>
          </div>
          <XxxPrimaryButtons />
        </div>

        {/* 表格容器 —— 关键CSS：flex flex-1 flex-col overflow-hidden */}
        <div className='-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1'>
          <ErrorBoundary fallbackMessage="表格渲染失败">
            <XxxTable />
          </ErrorBoundary>
        </div>
      </AppHeaderMain>

      <XxxDialogs />   {/* Dialog 放在 AppHeaderMain 外部 */}
    </XxxProvider>
  )
}
```

**关键要点**：
- `<AppHeaderMain fixed>` —— 必须传入 `fixed` prop
- 表格容器 div 使用 `flex flex-1 flex-col overflow-hidden`，**不要**用 `overflow-auto`
- `-mx-4 px-4` 用于消除 `Main` 组件自带的水平内边距，让表格占满宽度

### 7.3 表格组件层（Table Component）标准写法

#### 使用 `AdminDataTable` 封装组件的情况：

```tsx
// xxx-table.tsx
return (
  <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex min-h-0 flex-1 flex-col gap-4')}>
    <AdminDataTable
      table={table}
      columnsLength={columns.length}
      isLoading={isLoading}
      // ... 其他 props
    />
  </div>
)
```

#### 直接使用 `DataTable` + `DataTableToolbar` + `DataTablePagination` 的情况：

```tsx
// xxx-table.tsx
return (
  <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex min-h-0 flex-1 flex-col gap-4')}>
    <DataTableToolbar table={table} searchPlaceholder='搜索…' />
    <DataTable
      table={table}
      columnsLength={columns.length}
      isLoading={isLoading}
      skeletonCount={pagination.pageSize}
      emptyState='暂无数据'
      containerClassName='min-h-0 flex-1'   // ← 必须设置
    />
    <DataTablePagination table={table} />
  </div>
)
```

### 7.4 关键 CSS 类速查

| CSS 类 | 作用 | 使用位置 |
|--------|------|---------|
| `flex flex-col` | 纵向弹性布局 | 所有需要传递高度约束的容器 |
| `flex-1` | 占据剩余空间 | 表格容器、DataTable wrapper |
| `min-h-0` | 允许 flex 子元素收缩到小于内容高度 | 所有需要滚动的 flex 子元素 |
| `overflow-hidden` | 阻止内容溢出，将滚动委托给子元素 | 页面级容器 |
| `overflow-auto` | 在内容溢出时产生滚动条 | DataTable 内部的表格包裹层（自动处理） |

### 7.5 `Main` 组件的两种模式

`Main` 组件通过 `fixed` prop 切换两种布局模式：

- **`fixed` 模式**（表格页面使用）：`flex grow flex-col overflow-hidden`
  - 不产生滚动，将高度约束传递给子组件
  - 子组件自行管理各自的滚动区域

- **非 `fixed` 模式**（普通页面使用）：`flex-1 overflow-auto`
  - 整个内容区域作为滚动容器
  - 适用于表单页面、详情页面等不需要固定分页区域的场景

### 7.6 常见错误与排查

1. **分页被挤出视口** → 检查父级链中是否每层都有 `flex flex-col` 和 `flex-1`
2. **表格不滚动，整页滚动** → 检查是否有某层用了 `overflow-auto` 而不是 `overflow-hidden`
3. **表格高度为 0** → 检查是否缺少 `min-h-0`（flex 子元素默认 `min-height: auto` 不会收缩）
4. **`AppHeaderMain` 没有效果** → 确认传了 `fixed` prop
5. **新页面无法使用固定布局** → 确认 `TabContent` 使用 `flex flex-col` 而非 `overflow-auto`

### 7.7 `AdminDataTable` 封装组件

`AdminDataTable`（位于 `src/modules/admin/shared/components/admin-data-table.tsx`）已内置了固定布局所需的全部样式：
- 外层 div：`flex min-h-0 flex-1 flex-col gap-4`
- 内部 `DataTable`：自动添加 `containerClassName='min-h-0 flex-1'`

使用 `AdminDataTable` 时无需手动设置 `containerClassName`，只需确保外层包裹的 div 具有 `flex min-h-0 flex-1 flex-col` 即可。
