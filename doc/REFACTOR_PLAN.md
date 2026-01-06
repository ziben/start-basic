# 组织、成员、邀请、部门模块重构计划

## 参考架构：Users 模块

### Users 模块特点
1. **目录结构**
   ```
   users/
   ├── components/          # 表格、对话框、按钮等组件
   ├── data/               # Schema 定义
   ├── hooks/              # 自定义 hooks（查询、乐观更新）
   ├── utils/              # 工具函数（过滤器等）
   ├── users-page.tsx      # 主页面
   └── index.ts            # 导出
   ```

2. **核心技术**
   - `useUrlSyncedSorting`: URL 状态同步
   - `@tanstack/react-virtual`: 虚拟化滚动
   - 乐观更新：批量操作即时反馈
   - Provider 模式：状态管理
   - 统一 Query Key：缓存管理

3. **组件拆分**
   - `admin-users-table.tsx`: 主表格（含虚拟化）
   - `admin-users-provider.tsx`: Context Provider
   - `admin-users-columns.tsx`: 列定义
   - `data-table-bulk-actions.tsx`: 批量操作
   - `admin-users-multi-delete-dialog.tsx`: 删除确认
   - `admin-users-primary-buttons.tsx`: 主操作按钮
   - `admin-users-dialogs.tsx`: 对话框集合

## 重构目标

### 1. Organizations 模块
**目录结构**
```
organizations/
├── components/
│   ├── organizations-table.tsx
│   ├── organizations-provider.tsx
│   ├── organizations-columns.tsx
│   ├── organizations-bulk-actions.tsx
│   ├── organizations-multi-delete-dialog.tsx
│   ├── organizations-primary-buttons.tsx
│   └── organizations-dialogs.tsx
├── data/
│   └── schema.ts
├── hooks/
│   ├── use-organizations-list-query.ts
│   └── use-organizations-optimistic-update.ts
├── utils/
│   └── table-filters.ts
├── organizations-page.tsx
└── index.ts
```

**功能**
- URL 状态同步（分页、排序、搜索）
- 虚拟化滚动
- 批量删除
- 创建/编辑组织
- 按名称、slug 搜索

### 2. Members 模块
**目录结构**（同 organizations）

**功能**
- URL 状态同步
- 虚拟化滚动
- 批量删除、批量修改角色
- 按用户名、邮箱、组织搜索
- 角色过滤器

### 3. Departments 模块
**特殊需求**
- 树形结构展示
- 拖拽排序
- 层级管理
- 按组织过滤

### 4. Invitations 模块
**功能**
- URL 状态同步
- 批量删除、批量重发
- 状态过滤（pending/accepted/expired）
- 按邮箱搜索

## 实施步骤

### Phase 1: Organizations（优先）
1. 创建 schema 和类型定义
2. 实现 hooks（查询、乐观更新）
3. 实现表格组件（含虚拟化）
4. 实现批量操作
5. 实现对话框（创建、编辑、删除）
6. 整合到主页面

### Phase 2: Members
1. 复用 organizations 架构
2. 添加角色相关功能
3. 实现组织关联

### Phase 3: Departments
1. 基础表格功能
2. 树形结构展示
3. 拖拽排序（可选）

### Phase 4: Invitations
1. 复用架构
2. 添加状态管理
3. 实现重发功能

## 技术要点

### URL 状态同步
```typescript
const {
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  pagination,
  onPaginationChange,
  ensurePageInRange,
} = useUrlSyncedSorting({
  search,
  navigate,
  pagination: { defaultPage: 1, defaultPageSize: 10 },
  globalFilter: { enabled: true, key: 'filter' },
  columnFilters: [/* ... */],
})
```

### 虚拟化滚动
```typescript
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 44,
  overscan: 10,
})
```

### 乐观更新
```typescript
const { getOptimisticMutationOptions } = useOptimisticUpdate()

const mutation = useMutation({
  mutationFn: async (input) => { /* ... */ },
  ...getOptimisticMutationOptions({
    queryKey: QUERY_KEY,
    updateFn: (items, variables) => { /* ... */ },
  }),
})
```

## 优先级
1. **高**: Organizations（核心功能）
2. **高**: Members（关联组织）
3. **中**: Departments（独立功能）
4. **低**: Invitations（辅助功能）
