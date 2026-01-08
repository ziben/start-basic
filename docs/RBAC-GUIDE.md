# RBAC 权限系统使用指南

本项目基于 **better-auth** 实现了完整的 RBAC（基于角色的访问控制）系统，支持全局角色、组织角色和细粒度权限。

## 目录

- [架构概览](#架构概览)
- [权限层级](#权限层级)
- [服务端使用](#服务端使用)
- [前端使用](#前端使用)
- [最佳实践](#最佳实践)

## 架构概览

### 三层权限体系

1. **全局角色**（User.role）
   - `superadmin`: 超级管理员，拥有所有权限
   - `admin`: 管理员，可管理用户、组织、角色等
   - `user`: 普通用户，只能管理自己的资料

2. **组织角色**（Member.role）
   - `owner`: 组织所有者
   - `admin`: 组织管理员
   - `member`: 组织成员

3. **细粒度权限**（Permission 表）
   - 自定义权限，支持时间限制
   - 可分配给角色或用户

### 权限定义

```typescript
// src/modules/identity/shared/lib/auth.ts
export const statement = {
  user: ['create', 'read', 'update', 'delete', 'ban'],
  org: ['create', 'read', 'update', 'delete'],
  role: ['manage'],
  permission: ['manage'],
  nav: ['manage'],
  member: ['manage'],
  profile: ['read', 'update'],
} as const
```

## 服务端使用

### 1. 在 ServerFn 中检查权限

#### 方式一：使用 `requireAdmin`（简单场景）

```typescript
import { requireAdmin } from '~/modules/system-admin/shared/server-fns/auth'

export const getUsersFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // 要求用户是 admin 或 superadmin
    await requireAdmin('ListUsers')
    
    const { UserService } = await import('../services/user.service')
    return UserService.getList()
  })
```

#### 方式二：使用 `requirePermission`（细粒度权限）

```typescript
import { requirePermission } from '~/modules/system-admin/shared/server-fns/auth'

export const deleteUserFn = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    // 检查是否有 user:delete 权限
    await requirePermission('user:delete', {
      actionName: 'DeleteUser'
    })
    
    const { UserService } = await import('../services/user.service')
    return UserService.delete(data.id)
  })
```

#### 方式三：在组织上下文中检查权限

```typescript
export const updateOrgFn = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    // 检查用户在特定组织中的权限
    await requirePermission('org:update', {
      organizationId: data.orgId,
      actionName: 'UpdateOrganization'
    })
    
    // 执行更新操作
  })
```

### 2. 在 API 路由中使用中间件

```typescript
import { withAdminAuth, withAuth } from '~/middleware'

// 要求管理员权限
export const Route = createFileRoute('/api/admin/users')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ user, audit }) => {
        // user: 已认证的管理员用户
        // audit: 审计日志工具
        
        const prisma = (await import('@/shared/lib/db')).default
        const users = await prisma.user.findMany()
        
        // 记录审计日志
        await audit.log({
          action: 'ListUsers',
          targetType: 'User',
          success: true,
        })
        
        return Response.json(users)
      })
    }
  }
})

// 只要求登录
export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: withAuth(async ({ user }) => {
        // 任何登录用户都可以访问
        return Response.json(user)
      })
    }
  }
})
```

### 3. 直接使用权限检查函数

```typescript
import { 
  checkPermission,
  checkGlobalPermission,
  checkOrgPermission,
  getUserPermissions 
} from '~/modules/system-admin/shared/lib/permission-check'

// 检查全局权限
const canDeleteUser = await checkGlobalPermission(userId, 'user:delete')

// 检查组织权限
const canManageOrg = await checkOrgPermission(userId, orgId, 'org:update')

// 通用检查（自动判断全局或组织）
const hasPermission = await checkPermission(userId, 'user:read', {
  organizationId: orgId // 可选
})

// 获取用户所有权限
const permissions = await getUserPermissions(userId, orgId)
console.log(permissions) // ['user:read', 'user:update', 'profile:read', ...]
```

## 前端使用

### 1. 使用权限 Hooks

```typescript
import { 
  usePermissions,
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useIsAdmin 
} from '~/shared/hooks/use-permissions'

function MyComponent() {
  // 获取所有权限
  const { data: permissions, isLoading } = usePermissions()
  
  // 检查单个权限
  const { data: canDelete } = usePermission('user:delete')
  
  // 检查任一权限（满足一个即可）
  const { hasPermission: canManage } = useAnyPermission([
    'user:update',
    'user:delete'
  ])
  
  // 检查所有权限（必须全部满足）
  const { hasPermission: canFullAccess } = useAllPermissions([
    'user:read',
    'user:update',
    'user:delete'
  ])
  
  // 检查是否是管理员
  const { isAdmin, isSuperAdmin } = useIsAdmin()
  
  return (
    <div>
      {canDelete && <button>删除用户</button>}
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

### 2. 使用权限守卫组件

```typescript
import { 
  PermissionGuard,
  AdminGuard,
  SuperAdminGuard 
} from '~/shared/components/permission-guard'

function UserManagement() {
  return (
    <div>
      {/* 单个权限 */}
      <PermissionGuard permission="user:delete">
        <button>删除用户</button>
      </PermissionGuard>
      
      {/* 任一权限 */}
      <PermissionGuard anyPermissions={['user:update', 'user:delete']}>
        <button>编辑或删除</button>
      </PermissionGuard>
      
      {/* 全部权限 */}
      <PermissionGuard allPermissions={['user:read', 'user:update']}>
        <UserEditor />
      </PermissionGuard>
      
      {/* 管理员权限 */}
      <AdminGuard>
        <AdminPanel />
      </AdminGuard>
      
      {/* 超级管理员权限 */}
      <SuperAdminGuard>
        <SystemSettings />
      </SuperAdminGuard>
      
      {/* 带 fallback */}
      <PermissionGuard 
        permission="user:delete"
        fallback={<p>您没有删除权限</p>}
      >
        <button>删除</button>
      </PermissionGuard>
      
      {/* 组织上下文 */}
      <PermissionGuard 
        permission="org:update"
        organizationId={currentOrgId}
      >
        <button>更新组织</button>
      </PermissionGuard>
    </div>
  )
}
```

### 3. 在路由守卫中使用

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { requirePermission } from '~/modules/system-admin/shared/server-fns/auth'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: async () => {
    try {
      await requirePermission('user:read', {
        actionName: 'AccessUserManagement'
      })
    } catch {
      throw redirect({ to: '/403' })
    }
  },
  component: UserManagementPage,
})
```

## 最佳实践

### 1. 权限命名规范

使用 `resource:action` 格式：

```typescript
// ✅ 好的命名
'user:create'
'user:read'
'user:update'
'user:delete'
'org:manage'
'role:assign'

// ❌ 避免的命名
'createUser'
'manage_users'
'USER_DELETE'
```

### 2. 权限粒度设计

```typescript
// 粗粒度（适合简单场景）
'user:manage' // 包含所有用户操作

// 细粒度（适合复杂场景）
'user:create'
'user:read'
'user:update'
'user:delete'
'user:ban'
```

### 3. 角色设计建议

```typescript
// 全局角色：用于系统级权限
superadmin -> 所有权限
admin -> 管理用户、组织、系统配置
user -> 基本访问权限

// 组织角色：用于组织内权限
owner -> 组织内所有权限
admin -> 组织管理权限
member -> 组织成员权限
```

### 4. 性能优化

```typescript
// ✅ 使用缓存
const { data: permissions } = usePermissions() // 自动缓存 5 分钟

// ✅ 批量检查
const { hasPermission } = useAnyPermission(['user:read', 'user:update'])

// ❌ 避免频繁单独检查
const canRead = usePermission('user:read')
const canUpdate = usePermission('user:update')
const canDelete = usePermission('user:delete')
```

### 5. 错误处理

```typescript
// 服务端
try {
  await requirePermission('user:delete')
  // 执行操作
} catch (error) {
  if (error.message.includes('缺少权限')) {
    return new Response('权限不足', { status: 403 })
  }
  throw error
}

// 前端
const { data: canDelete, error } = usePermission('user:delete')

if (error) {
  return <ErrorMessage>权限检查失败</ErrorMessage>
}

if (!canDelete) {
  return <p>您没有删除权限</p>
}
```

### 6. 审计日志

```typescript
// 在关键操作中记录审计日志
export const deleteUserFn = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const user = await requirePermission('user:delete', {
      actionName: 'DeleteUser' // 会自动记录审计日志
    })
    
    // 执行删除
    await UserService.delete(data.id)
    
    return { success: true }
  })
```

## 常见问题

### Q: 如何添加新的权限？

1. 在 `auth.ts` 的 `statement` 中定义
2. 在角色定义中分配权限
3. 在需要的地方使用 `requirePermission` 或 `PermissionGuard`

### Q: 如何实现动态权限？

使用 Permission 表存储细粒度权限，支持：
- 时间限制（validFrom, validUntil）
- 角色分配
- 用户分配

### Q: 权限检查的性能如何？

- 前端：使用 React Query 缓存，默认 5 分钟
- 后端：使用 Prisma 查询，支持索引优化
- 建议：对于高频操作，使用批量检查

### Q: 如何处理权限继承？

```typescript
// superadmin 自动拥有所有权限
if (user.role === 'superadmin') return true

// 组织 owner 拥有组织内所有权限
if (member.role === 'owner') return true
```

## 相关文件

- `src/modules/identity/shared/lib/auth.ts` - better-auth 配置
- `src/modules/system-admin/shared/lib/permission-check.ts` - 权限检查函数
- `src/modules/system-admin/shared/server-fns/auth.ts` - 服务端认证工具
- `src/shared/hooks/use-permissions.ts` - 前端权限 Hooks
- `src/shared/components/permission-guard.tsx` - 权限守卫组件
- `src/middleware.ts` - 路由中间件
