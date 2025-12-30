# 移除 ZenStack 指南

## 为什么移除？

1. **未使用**: 代码中没有任何地方使用 ZenStack
2. **功能重复**: Better Auth + 自定义中间件已经提供完整的权限控制
3. **增加复杂度**: 需要维护两套 schema
4. **项目规模不需要**: 简单的 admin/user 权限不需要 ZenStack 的复杂功能

## 移除步骤

### 1. 卸载依赖

```bash
pnpm remove @zenstackhq/orm @zenstackhq/cli
```

### 2. 删除相关文件

```bash
# Windows PowerShell
Remove-Item -Recurse -Force zenstack

# 或手动删除
# - zenstack/schema.zmodel
# - zenstack/schema.prisma
```

### 3. 清理文档引用

编辑 `doc/optimization-recommendations.md`，移除以下内容：
- 第 374 行: ZenStack 集成提及
- 第 454 行: ZenStack 集成探索

### 4. 验证项目运行

```bash
pnpm install
pnpm dev
```

## 如果将来需要 ZenStack？

只在以下场景考虑重新引入：

1. **多租户应用**: 需要复杂的数据隔离（如 SaaS 平台）
2. **细粒度权限**: 字段级、行级权限控制
3. **快速原型**: 需要自动生成 CRUD API

## 当前权限方案（已足够）

```typescript
// 1. 路由级权限 - TanStack Router
export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async ({ context }) => {
    if (!context.user || !['admin', 'superadmin'].includes(context.user.role)) {
      throw redirect({ to: '/sign-in' })
    }
  }
})

// 2. API 级权限 - 自定义中间件
export const Route = createAPIFileRoute('/api/admin/users')({
  GET: withAdminAuth(async ({ user }) => {
    // user 已验证为 admin
    const users = await prisma.user.findMany()
    return Response.json(users)
  })
})

// 3. 数据级权限 - Prisma 查询
const users = await prisma.user.findMany({
  where: {
    // 根据当前用户角色过滤
    ...(user.role !== 'admin' && { id: user.id })
  }
})
```

## 节省的空间

- 包大小: ~2MB
- node_modules: ~50 个包
- 维护成本: 减少一套 schema 文件
