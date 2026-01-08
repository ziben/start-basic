# Better-Auth Dynamic Access Control 使用指南

本项目已启用 better-auth 的 **Dynamic Access Control**，提供组织级别的细粒度权限控制。

## 配置概览

### 组织权限定义

```typescript
// src/modules/identity/shared/lib/auth.ts

// 组织级别权限声明
export const orgStatement = {
  member: ['invite', 'remove', 'update'],
  project: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete', 'share'],
  settings: ['read', 'update'],
} as const

// 组织角色定义
export const orgOwner = orgAc.newRole({
  member: ['invite', 'remove', 'update'],
  project: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete', 'share'],
  settings: ['read', 'update'],
})

export const orgAdmin = orgAc.newRole({
  member: ['invite', 'remove', 'update'],
  project: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete', 'share'],
  settings: ['read'],
})

export const orgMember = orgAc.newRole({
  project: ['read', 'update'],
  document: ['create', 'read', 'update', 'share'],
  settings: ['read'],
})

export const orgViewer = orgAc.newRole({
  project: ['read'],
  document: ['read'],
  settings: ['read'],
})
```

### Better-Auth 配置

```typescript
organization({
  teams: { enabled: true },
  allowUserToCreateOrganization: true,
  organizationLimit: 10,
  dynamicAccessControl: {
    enabled: true,
    ac: orgAc,
    roles: {
      owner: orgOwner,
      admin: orgAdmin,
      member: orgMember,
      viewer: orgViewer,
    },
  },
})
```

## 服务端使用

### 方式一：使用 better-auth API

```typescript
import { auth } from '~/modules/identity/shared/lib/auth'

// 检查组织权限
const hasPermission = await auth.api.hasPermission({
  headers: request.headers,
  body: {
    organizationId: 'org-id',
    permission: {
      project: ['create']
    }
  }
})

if (!hasPermission) {
  return new Response('权限不足', { status: 403 })
}
```

### 方式二：在 ServerFn 中使用

```typescript
import { createServerFn } from '@tanstack/react-start'

export const createProjectFn = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/identity/shared/lib/auth')
    
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session?.user) {
      throw new Error('未登录')
    }
    
    // 检查组织权限
    const hasPermission = await auth.api.hasPermission({
      headers: request.headers,
      body: {
        organizationId: data.organizationId,
        permission: {
          project: ['create']
        }
      }
    })
    
    if (!hasPermission) {
      throw new Error('您没有创建项目的权限')
    }
    
    // 执行创建操作
    // ...
  })
```

### 方式三：使用自定义权限检查函数

```typescript
import { checkOrgPermission } from '~/modules/system-admin/shared/lib/permission-check'

// 在现有的权限检查函数中已集成 better-auth
const canManageProject = await checkOrgPermission(
  userId,
  organizationId,
  'project:update'
)
```

## 前端使用

### 使用组织权限 Hooks

```typescript
import { 
  useOrgPermission,
  useOrgRole,
  useIsOrgOwner,
  useIsOrgAdmin 
} from '~/shared/hooks/use-org-permissions'

function ProjectManagement({ organizationId }: { organizationId: string }) {
  // 检查单个权限
  const { data: canCreateProject } = useOrgPermission(
    organizationId,
    'project',
    'create'
  )
  
  // 获取用户在组织中的角色
  const { data: role } = useOrgRole(organizationId)
  
  // 检查是否是所有者
  const { isOwner } = useIsOrgOwner(organizationId)
  
  // 检查是否是管理员
  const { isOrgAdmin } = useIsOrgAdmin(organizationId)
  
  return (
    <div>
      {canCreateProject && (
        <button>创建项目</button>
      )}
      
      {isOrgAdmin && (
        <button>管理成员</button>
      )}
      
      {isOwner && (
        <button>组织设置</button>
      )}
      
      <p>当前角色: {role}</p>
    </div>
  )
}
```

### 使用权限守卫组件

```typescript
import { PermissionGuard } from '~/shared/components/permission-guard'

function OrganizationDashboard({ organizationId }: { organizationId: string }) {
  return (
    <div>
      {/* 使用 organizationId 参数进行组织权限检查 */}
      <PermissionGuard 
        permission="project:create"
        organizationId={organizationId}
      >
        <button>创建项目</button>
      </PermissionGuard>
      
      <PermissionGuard 
        permission="member:invite"
        organizationId={organizationId}
      >
        <button>邀请成员</button>
      </PermissionGuard>
      
      <PermissionGuard 
        permission="settings:update"
        organizationId={organizationId}
        fallback={<p>您没有修改设置的权限</p>}
      >
        <SettingsPanel />
      </PermissionGuard>
    </div>
  )
}
```

## 权限层级

### 1. 全局权限（优先级最高）

- `superadmin` 拥有所有权限（包括组织内权限）
- `admin` 拥有系统管理权限

### 2. 组织权限（在组织上下文中）

- `owner` - 组织所有者，拥有组织内所有权限
- `admin` - 组织管理员，可管理成员和项目
- `member` - 普通成员，可查看和编辑
- `viewer` - 只读成员

### 3. 权限检查流程

```typescript
// 权限检查优先级
1. 检查全局角色（superadmin/admin 自动通过）
2. 检查组织角色权限（owner/admin/member/viewer）
3. 检查自定义细粒度权限（Permission 表）
```

## 组织角色权限矩阵

| 资源 | 操作 | owner | admin | member | viewer |
|------|------|-------|-------|--------|--------|
| member | invite | ✅ | ✅ | ❌ | ❌ |
| member | remove | ✅ | ✅ | ❌ | ❌ |
| member | update | ✅ | ✅ | ❌ | ❌ |
| project | create | ✅ | ✅ | ❌ | ❌ |
| project | read | ✅ | ✅ | ✅ | ✅ |
| project | update | ✅ | ✅ | ✅ | ❌ |
| project | delete | ✅ | ✅ | ❌ | ❌ |
| document | create | ✅ | ✅ | ✅ | ❌ |
| document | read | ✅ | ✅ | ✅ | ✅ |
| document | update | ✅ | ✅ | ✅ | ❌ |
| document | delete | ✅ | ✅ | ❌ | ❌ |
| document | share | ✅ | ✅ | ✅ | ❌ |
| settings | read | ✅ | ✅ | ✅ | ✅ |
| settings | update | ✅ | ❌ | ❌ | ❌ |

## 最佳实践

### 1. 权限命名规范

```typescript
// ✅ 好的命名
'project:create'
'member:invite'
'document:share'

// ❌ 避免的命名
'createProject'
'invite_member'
'DOCUMENT_SHARE'
```

### 2. 组织上下文传递

```typescript
// 始终传递 organizationId
<PermissionGuard 
  permission="project:create"
  organizationId={currentOrgId}  // 必须传递
>
  <CreateProjectButton />
</PermissionGuard>
```

### 3. 角色设计建议

```typescript
// owner: 完全控制
// - 可以删除组织
// - 可以转让所有权
// - 可以修改所有设置

// admin: 日常管理
// - 可以管理成员
// - 可以管理项目
// - 不能修改组织设置

// member: 协作工作
// - 可以查看和编辑项目
// - 可以创建文档
// - 不能管理成员

// viewer: 只读访问
// - 只能查看内容
// - 不能进行任何修改
```

### 4. 性能优化

```typescript
// ✅ 使用缓存
const { data: canCreate } = useOrgPermission(orgId, 'project', 'create')
// 自动缓存 5 分钟

// ✅ 批量检查角色
const { isOrgAdmin } = useIsOrgAdmin(orgId)
// 一次查询，多次使用

// ❌ 避免频繁单独检查
const canInvite = useOrgPermission(orgId, 'member', 'invite')
const canRemove = useOrgPermission(orgId, 'member', 'remove')
const canUpdate = useOrgPermission(orgId, 'member', 'update')
```

## 常见问题

### Q: 如何添加新的组织权限？

1. 在 `orgStatement` 中添加新的资源和操作
2. 在组织角色中分配权限
3. 在需要的地方使用权限检查

```typescript
// 1. 添加到 orgStatement
export const orgStatement = {
  // ...existing
  task: ['create', 'read', 'update', 'delete', 'assign'],
}

// 2. 分配给角色
export const orgAdmin = orgAc.newRole({
  // ...existing
  task: ['create', 'read', 'update', 'delete', 'assign'],
})

// 3. 使用
const { data: canAssignTask } = useOrgPermission(orgId, 'task', 'assign')
```

### Q: 全局管理员在组织中有权限吗？

是的，全局 `superadmin` 和 `admin` 在所有组织中自动拥有完全权限。权限检查函数会优先检查全局角色。

### Q: 如何实现自定义组织角色？

目前支持 4 个预定义角色（owner, admin, member, viewer）。如需更多角色，可以：

1. 在 `orgStatement` 中定义新角色
2. 使用 `orgAc.newRole()` 创建角色
3. 在 `dynamicAccessControl.roles` 中注册

### Q: 权限检查的性能如何？

- 前端：React Query 缓存 5 分钟
- 后端：Prisma 查询，单次数据库访问
- 建议：对于高频操作，使用角色检查而非单个权限检查

## 相关文件

- `src/modules/identity/shared/lib/auth.ts` - Dynamic Access Control 配置
- `src/shared/hooks/use-org-permissions.ts` - 组织权限 Hooks
- `src/modules/system-admin/shared/lib/permission-check.ts` - 权限检查函数
- `docs/RBAC-GUIDE.md` - 完整 RBAC 系统指南

## 迁移指南

如果你之前使用自定义组织权限系统，迁移到 better-auth dynamic access control：

```typescript
// 旧方式
const member = await prisma.member.findFirst({
  where: { userId, organizationId }
})
if (member.role !== 'owner') {
  throw new Error('权限不足')
}

// 新方式（推荐）
const hasPermission = await auth.api.hasPermission({
  headers: request.headers,
  body: {
    organizationId,
    permission: { settings: ['update'] }
  }
})
if (!hasPermission) {
  throw new Error('权限不足')
}
```
