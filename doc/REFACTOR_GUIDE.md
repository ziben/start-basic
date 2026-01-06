# 组织、成员、邀请、部门模块重构指南

## 当前状态分析

### 现有问题
1. **organization-page.tsx**: 单文件 400+ 行，混合了表格、状态、UI
2. **member-page.tsx**: 单文件 300+ 行，缺少虚拟化和批量操作
3. **缺少统一架构**: 各模块实现方式不一致
4. **性能问题**: 无虚拟化滚动，大数据渲染慢
5. **URL 状态**: 部分实现了 URL 同步，但不完整

### Users 模块优势（参考标准）
```
users/
├── components/
│   ├── admin-users-table.tsx          # 表格（含虚拟化）
│   ├── admin-users-columns.tsx        # 列定义
│   ├── data-table-bulk-actions.tsx    # 批量操作
│   ├── admin-users-multi-delete-dialog.tsx
│   ├── admin-users-primary-buttons.tsx
│   ├── admin-users-provider.tsx       # Context
│   └── admin-users-dialogs.tsx
├── data/schema.ts                      # 类型定义
├── hooks/
│   ├── use-admin-users-list-query.ts  # 查询 + 预加载
│   └── use-users-optimistic-update.ts # 乐观更新
├── utils/table-filters.ts
└── users-page.tsx                      # 主页面（简洁）
```

**核心优势**：
- ✅ 虚拟化滚动（处理大数据）
- ✅ URL 状态完全同步
- ✅ 批量操作 + 乐观更新
- ✅ 组件高度模块化
- ✅ 统一的 Query Key 管理
- ✅ 预加载下一页

## 重构方案

### 方案 A: 完整重构（推荐，但工作量大）
**优点**: 架构统一，长期维护性好
**缺点**: 需要 2-3 天时间
**适用**: 项目长期维护，团队规模较大

### 方案 B: 渐进式优化（实用）
**优点**: 快速见效，风险可控
**缺点**: 架构不完全统一
**适用**: 快速迭代，小团队

### 方案 C: 混合方案（建议）
**核心模块完整重构**: Organizations, Members
**其他模块渐进优化**: Departments, Invitations

## 快速实施步骤（方案 C）

### Step 1: 创建通用工具（1小时）
```typescript
// src/shared/hooks/use-optimistic-list-update.ts
export function useOptimisticListUpdate<T extends { id: string }>() {
  return {
    getOptimisticMutationOptions: ({ queryKey, updateFn }) => ({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey })
        const previous = queryClient.getQueriesData({ queryKey })
        
        queryClient.setQueriesData({ queryKey }, (old: any) => {
          if (!old?.items) return old
          return {
            ...old,
            items: updateFn(old.items, variables),
          }
        })
        
        return { previous }
      },
      onError: (err, variables, context) => {
        // 回滚
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey })
      },
    })
  }
}
```

### Step 2: Organizations 模块（3-4小时）

#### 2.1 创建 Schema
```typescript
// organizations/data/schema.ts
export type Organization = {
  id: string
  name: string
  slug: string | null
  logo: string | null
  createdAt: string
  _count?: {
    members: number
    departments: number
  }
}
```

#### 2.2 创建 Query Hook
```typescript
// organizations/hooks/use-organizations-list-query.ts
export const ORGANIZATIONS_QUERY_KEY = ['admin-organizations']

export function useOrganizationsListQuery(input) {
  // 参考 users 模块实现
  // 1. URL 参数构建
  // 2. React Query 配置
  // 3. 预加载下一页
}
```

#### 2.3 创建表格组件
```typescript
// organizations/components/organizations-table.tsx
export function OrganizationsTable() {
  // 1. useUrlSyncedSorting
  // 2. useReactTable
  // 3. useVirtualizer
  // 4. 渲染虚拟化表格
}
```

#### 2.4 创建批量操作
```typescript
// organizations/components/organizations-bulk-actions.tsx
export function OrganizationsBulkActions({ table }) {
  // 1. 批量删除
  // 2. 批量导出
  // 3. 乐观更新
}
```

#### 2.5 整合主页面
```typescript
// organizations/organizations-page.tsx
export default function OrganizationsPage() {
  return (
    <OrganizationsProvider>
      <AppHeaderMain>
        <OrganizationsTable />
      </AppHeaderMain>
      <OrganizationsDialogs />
    </OrganizationsProvider>
  )
}
```

### Step 3: Members 模块（2-3小时）
复用 Organizations 架构，添加：
- 角色过滤器
- 组织关联
- 批量修改角色

### Step 4: Departments 模块（2小时）
保留现有实现，添加：
- 虚拟化滚动
- URL 状态同步
- 批量操作

### Step 5: Invitations 模块（1小时）
简化实现：
- 基础表格 + URL 同步
- 批量删除/重发

## 关键代码模板

### 虚拟化表格模板
```typescript
const tableContainerRef = useRef<HTMLDivElement>(null)
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 44,
  overscan: 10,
})

const virtualRows = rowVirtualizer.getVirtualItems()
const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
const paddingBottom = virtualRows.length > 0 
  ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end 
  : 0

return (
  <div ref={tableContainerRef} className='max-h-[70vh] overflow-auto'>
    <Table>
      <TableBody>
        {paddingTop > 0 && <TableRow style={{ height: paddingTop }} />}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index]
          return <TableRow key={row.id}>...</TableRow>
        })}
        {paddingBottom > 0 && <TableRow style={{ height: paddingBottom }} />}
      </TableBody>
    </Table>
  </div>
)
```

### URL 状态同步模板
```typescript
const {
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
  ensurePageInRange,
} = useUrlSyncedSorting({
  search,
  navigate,
  pagination: { defaultPage: 1, defaultPageSize: 10 },
  globalFilter: { enabled: true, key: 'filter' },
})
```

### 批量操作模板
```typescript
const { getOptimisticMutationOptions } = useOptimisticUpdate()

const bulkDeleteMutation = useMutation({
  mutationFn: async ({ ids }) => {
    return await bulkDeleteFn({ data: { ids } })
  },
  ...getOptimisticMutationOptions({
    queryKey: QUERY_KEY,
    updateFn: (items, variables) => 
      items.filter(item => !variables.ids.includes(item.id)),
  }),
})
```

## 预期收益

### 性能提升
- 虚拟化滚动：1000+ 条数据流畅渲染
- 预加载：翻页无延迟
- 乐观更新：操作即时反馈

### 开发体验
- 代码模块化：单文件 < 200 行
- 统一架构：新功能快速复制
- 类型安全：完整的 TypeScript 支持

### 用户体验
- URL 可分享：带状态的链接
- 批量操作：提升效率
- 流畅交互：无卡顿

## 实施建议

1. **先做 Organizations**: 作为模板，验证架构
2. **快速复制到 Members**: 复用 90% 代码
3. **渐进优化其他模块**: 根据优先级
4. **保留旧代码**: 新旧并存，逐步迁移
5. **充分测试**: 每个模块完成后测试

## 文件清单

### 已创建
- ✅ `doc/REFACTOR_PLAN.md` - 详细计划
- ✅ `doc/REFACTOR_GUIDE.md` - 实施指南（本文件）
- ✅ `organizations/data/schema.ts` - 类型定义
- ✅ `organizations/hooks/use-organizations-list-query.ts` - 查询 hook
- ✅ `organizations/hooks/use-organizations-optimistic-update.ts` - 乐观更新

### 待创建（Organizations）
- ⏳ `organizations/components/organizations-table.tsx`
- ⏳ `organizations/components/organizations-columns.tsx`
- ⏳ `organizations/components/organizations-bulk-actions.tsx`
- ⏳ `organizations/components/organizations-multi-delete-dialog.tsx`
- ⏳ `organizations/components/organizations-primary-buttons.tsx`
- ⏳ `organizations/components/organizations-provider.tsx`
- ⏳ `organizations/components/organizations-dialogs.tsx`
- ⏳ `organizations/organizations-page.tsx`
- ⏳ `organizations/index.ts`

### 待创建（Members）
- ⏳ 复用 Organizations 架构

## 下一步行动

**建议优先级**：
1. 完成 Organizations 表格组件（核心）
2. 实现批量操作
3. 测试并优化
4. 复制到 Members 模块
5. 渐进优化 Departments

**预计时间**：
- Organizations: 4-5 小时
- Members: 2-3 小时
- Departments: 1-2 小时
- 总计: 7-10 小时

需要我继续实现具体的组件吗？
