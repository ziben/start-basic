# 统一权限管理架构设计

## 设计目标

1. **统一管理**：全局角色、组织角色、扩展角色在同一界面管理
2. **持久化**：角色、权限、资源定义存储在数据库
3. **动态加载**：系统启动时从数据库加载权限配置
4. **灵活扩展**：支持自定义角色和权限
5. **保护内置**：系统内置角色不可删除，只能查看

## 数据库设计

### 1. Role 表（统一角色表）

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // 角色名称：superadmin, admin, user, org-owner, org-admin, custom-role-1
  displayName String   // 显示名称：超级管理员、管理员、普通用户
  description String?  // 角色描述
  scope       RoleScope // 角色作用域：GLOBAL, ORGANIZATION, CUSTOM
  isSystem    Boolean  @default(false) // 是否系统内置（不可删除）
  isActive    Boolean  @default(true)  // 是否启用
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  rolePermissions RolePermission[]
  
  @@index([scope])
  @@index([isSystem])
  @@map("role")
}

enum RoleScope {
  GLOBAL        // 全局角色（superadmin, admin, user）
  ORGANIZATION  // 组织角色（owner, admin, member, viewer）
  CUSTOM        // 自定义扩展角色
}
```

### 2. Resource 表（资源表）

```prisma
model Resource {
  id          String   @id @default(cuid())
  name        String   @unique // 资源名称：user, org, project, document
  displayName String   // 显示名称：用户、组织、项目、文档
  description String?  // 资源描述
  scope       ResourceScope // 资源作用域
  isSystem    Boolean  @default(false) // 是否系统内置
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  actions     Action[]
  permissions Permission[]
  
  @@index([scope])
  @@map("resource")
}

enum ResourceScope {
  GLOBAL        // 全局资源
  ORGANIZATION  // 组织资源
  BOTH          // 两者都支持
}
```

### 3. Action 表（操作表）

```prisma
model Action {
  id          String   @id @default(cuid())
  resourceId  String   // 所属资源
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  name        String   // 操作名称：create, read, update, delete
  displayName String   // 显示名称：创建、查看、更新、删除
  description String?  // 操作描述
  isSystem    Boolean  @default(false) // 是否系统内置
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  permissions Permission[]
  
  @@unique([resourceId, name])
  @@index([resourceId])
  @@map("action")
}
```

### 4. Permission 表（权限表 - 合并细粒度权限）

```prisma
model Permission {
  id          String   @id @default(cuid())
  resourceId  String   // 资源
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  actionId    String   // 操作
  action      Action   @relation(fields: [actionId], references: [id], onDelete: Cascade)
  code        String   @unique // 权限代码：user:create, org:read, project:update
  displayName String   // 显示名称：创建用户、查看组织
  description String?  // 权限描述
  isSystem    Boolean  @default(false) // 是否系统内置
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  rolePermissions RolePermission[]
  
  @@unique([resourceId, actionId])
  @@index([code])
  @@map("permission")
}
```

### 5. RolePermission 表（角色-权限关联表）

```prisma
model RolePermission {
  id           String    @id @default(cuid())
  roleId       String    // 角色
  role         Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String    // 权限
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  // 权限约束（可选）
  conditions   Json?     // 权限条件：{ "departmentId": "xxx" }
  validFrom    DateTime? // 生效时间
  validUntil   DateTime? // 失效时间
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("rolePermission")
}
```

### 6. 保留现有的 User 和 Member 表

```prisma
// User 表保持不变
model User {
  // ...
  role String @default("user") // 引用 Role.name
}

// Member 表保持不变
model Member {
  // ...
  role String // 引用 Role.name（组织角色）
}
```

### 7. 删除/重用 OrganizationRole 表

**方案 A：删除 OrganizationRole**（推荐）
- 使用统一的 Role 表，通过 scope 区分

**方案 B：重用 OrganizationRole 作为组织自定义角色**
```prisma
model OrganizationRole {
  id             String       @id
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  roleId         String       // 引用 Role.id
  role           Role         @relation(fields: [roleId], references: [id])
  // 组织可以自定义角色权限
  customPermissions Json?
  
  @@unique([organizationId, roleId])
  @@map("organizationRole")
}
```

## 系统初始化流程

### 1. 数据库 Seed

```typescript
// db/prisma/seed-permissions.ts

async function seedPermissions() {
  // 1. 创建资源
  const resources = [
    { name: 'user', displayName: '用户', scope: 'GLOBAL', isSystem: true },
    { name: 'org', displayName: '组织', scope: 'GLOBAL', isSystem: true },
    { name: 'role', displayName: '角色', scope: 'GLOBAL', isSystem: true },
    { name: 'permission', displayName: '权限', scope: 'GLOBAL', isSystem: true },
    { name: 'project', displayName: '项目', scope: 'ORGANIZATION', isSystem: true },
    { name: 'document', displayName: '文档', scope: 'ORGANIZATION', isSystem: true },
    { name: 'member', displayName: '成员', scope: 'ORGANIZATION', isSystem: true },
  ]
  
  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { name: resource.name },
      update: {},
      create: resource
    })
  }
  
  // 2. 创建操作
  const actions = [
    { name: 'create', displayName: '创建' },
    { name: 'read', displayName: '查看' },
    { name: 'update', displayName: '更新' },
    { name: 'delete', displayName: '删除' },
    { name: 'manage', displayName: '管理' },
  ]
  
  for (const resource of await prisma.resource.findMany()) {
    for (const action of actions) {
      await prisma.action.upsert({
        where: { 
          resourceId_name: { 
            resourceId: resource.id, 
            name: action.name 
          } 
        },
        update: {},
        create: {
          resourceId: resource.id,
          name: action.name,
          displayName: action.displayName,
          isSystem: true
        }
      })
    }
  }
  
  // 3. 创建权限
  const permissions = [
    { resource: 'user', action: 'create', code: 'user:create' },
    { resource: 'user', action: 'read', code: 'user:read' },
    { resource: 'user', action: 'update', code: 'user:update' },
    { resource: 'user', action: 'delete', code: 'user:delete' },
    // ... 更多权限
  ]
  
  for (const perm of permissions) {
    const resource = await prisma.resource.findUnique({ where: { name: perm.resource } })
    const action = await prisma.action.findFirst({ 
      where: { resourceId: resource!.id, name: perm.action } 
    })
    
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        resourceId: resource!.id,
        actionId: action!.id,
        code: perm.code,
        displayName: `${action!.displayName}${resource!.displayName}`,
        isSystem: true
      }
    })
  }
  
  // 4. 创建角色
  const roles = [
    { 
      name: 'superadmin', 
      displayName: '超级管理员', 
      scope: 'GLOBAL', 
      isSystem: true,
      permissions: ['*'] // 所有权限
    },
    { 
      name: 'admin', 
      displayName: '管理员', 
      scope: 'GLOBAL', 
      isSystem: true,
      permissions: ['user:*', 'org:*', 'role:manage', 'permission:manage']
    },
    { 
      name: 'user', 
      displayName: '普通用户', 
      scope: 'GLOBAL', 
      isSystem: true,
      permissions: ['profile:read', 'profile:update']
    },
    { 
      name: 'owner', 
      displayName: '组织所有者', 
      scope: 'ORGANIZATION', 
      isSystem: true,
      permissions: ['project:*', 'document:*', 'member:*']
    },
    { 
      name: 'admin', 
      displayName: '组织管理员', 
      scope: 'ORGANIZATION', 
      isSystem: true,
      permissions: ['project:*', 'document:*', 'member:invite', 'member:remove']
    },
    { 
      name: 'member', 
      displayName: '组织成员', 
      scope: 'ORGANIZATION', 
      isSystem: true,
      permissions: ['project:read', 'project:update', 'document:*']
    },
    { 
      name: 'viewer', 
      displayName: '组织访客', 
      scope: 'ORGANIZATION', 
      isSystem: true,
      permissions: ['project:read', 'document:read']
    },
  ]
  
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        displayName: role.displayName,
        scope: role.scope,
        isSystem: role.isSystem
      }
    })
    
    // 分配权限
    for (const permCode of role.permissions) {
      if (permCode === '*') {
        // 分配所有权限
        const allPermissions = await prisma.permission.findMany()
        for (const perm of allPermissions) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: createdRole.id,
                permissionId: perm.id
              }
            },
            update: {},
            create: {
              roleId: createdRole.id,
              permissionId: perm.id
            }
          })
        }
      } else {
        // 处理通配符和具体权限
        // user:* 或 user:create
      }
    }
  }
}
```

### 2. 动态加载 Access Control

```typescript
// src/modules/identity/shared/lib/auth-dynamic.ts

import { createAccessControl } from 'better-auth/plugins/access'
import prisma from '@/shared/lib/db'

/**
 * 从数据库加载权限配置并创建 access control
 */
export async function loadAccessControl() {
  // 1. 加载所有资源和操作
  const resources = await prisma.resource.findMany({
    include: { actions: true }
  })
  
  // 2. 构建 statement
  const statement: Record<string, string[]> = {}
  for (const resource of resources) {
    statement[resource.name] = resource.actions.map(a => a.name)
  }
  
  // 3. 创建 access control
  const ac = createAccessControl(statement)
  
  // 4. 加载角色和权限
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      rolePermissions: {
        include: {
          permission: {
            include: {
              resource: true,
              action: true
            }
          }
        }
      }
    }
  })
  
  // 5. 构建角色定义
  const roleDefinitions: Record<string, any> = {}
  
  for (const role of roles) {
    const permissions: Record<string, string[]> = {}
    
    for (const rp of role.rolePermissions) {
      const resourceName = rp.permission.resource.name
      const actionName = rp.permission.action.name
      
      if (!permissions[resourceName]) {
        permissions[resourceName] = []
      }
      permissions[resourceName].push(actionName)
    }
    
    roleDefinitions[role.name] = ac.newRole(permissions)
  }
  
  return { ac, roles: roleDefinitions, statement }
}

/**
 * 缓存的 access control（避免每次请求都查数据库）
 */
let cachedAC: Awaited<ReturnType<typeof loadAccessControl>> | null = null
let lastLoadTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

export async function getAccessControl() {
  const now = Date.now()
  
  if (!cachedAC || now - lastLoadTime > CACHE_TTL) {
    cachedAC = await loadAccessControl()
    lastLoadTime = now
  }
  
  return cachedAC
}

/**
 * 清除缓存（权限更新后调用）
 */
export function clearAccessControlCache() {
  cachedAC = null
}
```

### 3. 更新 auth.ts

```typescript
// src/modules/identity/shared/lib/auth.ts

import { betterAuth } from 'better-auth'
import { admin, username, organization } from 'better-auth/plugins'
import { getAccessControl } from './auth-dynamic'

// 初始化时加载权限配置
const { ac, roles } = await getAccessControl()

export const auth = betterAuth({
  // ... 其他配置
  plugins: [
    username(),
    organization({
      teams: { enabled: false }, // 禁用 teams
      dynamicAccessControl: {
        enabled: true,
        ac,
        roles, // 从数据库加载的角色
      },
    }),
    admin({
      defaultRole: 'user',
      ac,
      roles, // 从数据库加载的角色
    }),
  ],
})
```

## 统一管理界面设计

### 页面结构

```
/admin/permissions
├── /roles          - 角色管理
│   ├── 列表（区分全局/组织/自定义）
│   ├── 创建自定义角色
│   ├── 编辑角色权限
│   └── 查看系统角色（只读）
├── /permissions    - 权限管理
│   ├── 资源列表
│   ├── 操作列表
│   └── 权限矩阵视图
└── /assignments    - 权限分配
    ├── 角色-权限矩阵
    └── 批量分配
```

### 核心功能

1. **角色管理**
   - 查看所有角色（标记系统内置）
   - 创建自定义角色
   - 编辑自定义角色权限
   - 禁用/启用角色
   - 系统角色只读，不可删除

2. **权限管理**
   - 查看所有资源和操作
   - 创建自定义资源和操作
   - 权限矩阵视图

3. **权限分配**
   - 角色-权限关联矩阵
   - 批量勾选分配
   - 权限继承关系可视化

## 优势

1. ✅ **统一管理**：所有角色在一个界面，清晰区分系统/自定义
2. ✅ **灵活扩展**：可以随时添加新角色、资源、权限
3. ✅ **持久化**：所有配置存储在数据库，支持备份和迁移
4. ✅ **动态加载**：系统启动时加载，支持热更新（清除缓存）
5. ✅ **保护内置**：系统角色标记为 isSystem，不可删除
6. ✅ **权限细化**：资源-操作-权限三层结构，更清晰
7. ✅ **兼容现有**：User.role 和 Member.role 继续使用，只是引用数据库中的角色名

## 迁移步骤

1. 创建新表结构
2. 运行 seed 脚本初始化数据
3. 实现动态加载逻辑
4. 更新 auth.ts 使用动态配置
5. 创建管理界面
6. 测试和验证
7. 清理旧代码

## 注意事项

1. **性能**：使用缓存避免每次请求都查数据库
2. **缓存更新**：权限修改后需要清除缓存或通知所有实例
3. **向后兼容**：保持 User.role 和 Member.role 字段，只是值引用数据库
4. **权限验证**：检查权限时仍然使用 better-auth 的 API
