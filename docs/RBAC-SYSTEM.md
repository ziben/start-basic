# RBAC 权限系统完善文档

## 概述

已完成 RBAC（基于角色的访问控制）权限系统的数据模型设计和初始化，实现了统一管理全局角色、组织角色模板和自定义角色的完整体系。

## 设计说明

### 为什么复用 OrganizationRole 表？

系统中已存在 `OrganizationRole` 表（来自 better-auth 的 dynamicAccessControl 插件），为了避免重复设计和数据冗余，我们选择**增强现有的 OrganizationRole 表**，而不是新建 `OrganizationRoleInstance` 表。

**增强方案：**
1. 保留 better-auth 的原有字段（`organizationId`, `role`, `permission`）以保持兼容性
2. 添加新字段支持角色模板功能（`templateRoleId`, `displayName`, `description`）
3. 新增 `OrganizationRolePermission` 表，用结构化方式管理权限列表，替代扁平化的 `permission` 字段
4. 支持基于模板创建角色，也支持完全自定义角色

**优势：**
- 避免数据重复和表冗余
- 保持与 better-auth 的兼容性
- 统一的组织角色管理入口
- 更灵活的权限配置方式

## 数据模型设计

### 核心表结构

#### 1. Role（角色表）
统一管理全局角色、组织角色模板、自定义角色。

**关键字段：**
- `name`: 角色名称（唯一）
- `displayName`: 显示名称
- `scope`: 角色作用域（GLOBAL/ORGANIZATION/CUSTOM）
- `isSystem`: 是否系统内置
- `isTemplate`: 是否为组织角色模板
- `isActive`: 是否启用
- `sortOrder`: 排序顺序
- `category`: 角色分类

**角色类型：**
- **全局角色**：`superadmin`, `admin`, `user`
- **组织角色模板**：`org-owner`, `org-admin`, `org-member`, `org-viewer`
- **自定义角色模板**：`content-editor`, `content-reviewer` 等

#### 2. Resource（资源表）
定义系统中的所有资源。

**资源作用域：**
- `GLOBAL`: 全局资源（user, role, permission, system-log, audit-log）
- `ORGANIZATION`: 组织资源（organization, member, department, org-role）
- `BOTH`: 通用资源（navigation, translation, question, category）

#### 3. Action（操作表）
定义资源上的操作。

**标准操作：**
- `create`: 创建
- `read`: 查看
- `update`: 更新
- `delete`: 删除
- `list`: 列表
- `manage`: 管理
- `assign`: 分配
- `approve`: 审批
- `export`: 导出
- `import`: 导入

#### 4. Permission（权限表）
资源-操作组合，形成具体权限。

**权限代码格式：** `{resource}:{action}`
- 示例：`user:create`, `org:read`, `member:update`

#### 5. RolePermission（角色-权限关联表）
持久化角色和权限的关系。

**数据范围控制：**
- `ALL`: 所有数据
- `ORG`: 组织范围
- `DEPT`: 部门范围
- `DEPT_AND_SUB`: 部门及子部门
- `SELF`: 仅自己

**时间限制：**
- `validFrom`: 生效时间
- `validUntil`: 失效时间
- `timeRanges`: 时间段限制

#### 6. OrganizationRole（组织角色表 - 增强版）
**复用 better-auth 的 OrganizationRole 表，增强功能支持角色模板和自定义权限。**

**关键字段：**
- `organizationId`: 所属组织
- `role`: 角色名称（在组织内唯一）
- `displayName`: 显示名称
- `description`: 角色描述
- `templateRoleId`: 基于哪个角色模板创建（可选）
- `permission`: better-auth 原有字段（保留兼容性）
- `isActive`: 是否启用
- `metadata`: 扩展元数据

**关键特性：**
- 可基于角色模板创建（`templateRoleId` 关联到 `Role` 表）
- 可完全自定义（不使用模板）
- 通过 `OrganizationRolePermission` 表管理权限列表
- 保留 better-auth 的 `permission` 字段以兼容现有功能

#### 7. OrganizationRolePermission（组织角色权限表）
组织角色的权限列表，替代扁平化的 `permission` 字段。

**数据范围控制：**
- `dataScope`: ORG（组织范围）、DEPT（部门范围）、SELF（仅自己）
- `customScope`: 自定义范围条件（JSON）

#### 8. FieldPermission（字段级权限表）
细粒度的字段级权限控制。

#### 9. CrossOrgAccess（跨组织访问授权表）
支持跨组织访问控制。

### 数据库迁移

已生成迁移文件：
```
db/prisma/migrations/20260109054208_add_rbac_role_templates_and_org_instances/
```

## 初始化数据

### 运行初始化脚本

```bash
npx tsx db/prisma/seeds/rbac-seed.ts
```

### 初始化内容

#### 1. 系统角色（9个）

**全局角色：**
- `superadmin`: 超级管理员（所有权限）
- `admin`: 管理员（大部分权限，排除敏感删除操作）
- `user`: 普通用户（基础查看权限）

**组织角色模板：**
- `org-owner`: 组织所有者（组织内所有权限）
- `org-admin`: 组织管理员（管理成员和设置）
- `org-member`: 组织成员（查看权限）
- `org-viewer`: 组织访客（只读权限）

**自定义角色模板：**
- `content-editor`: 内容编辑
- `content-reviewer`: 内容审核

#### 2. 资源（13个）

- 全局资源：user, role, permission, system-log, audit-log
- 组织资源：organization, member, department, org-role
- 通用资源：navigation, translation, question, category

#### 3. 操作（10个）

- CRUD：create, read, update, delete, list
- 管理：manage, assign, approve, export, import

#### 4. 权限（130个）

每个资源 × 10个操作 = 130个权限组合

#### 5. 角色权限分配

- **superadmin**: 所有权限（130个）
- **admin**: 大部分权限（排除 role:delete, permission:delete, user:delete）
- **user**: 基础查看权限（所有 :read 和 :list）
- **org-owner**: 组织内所有权限
- **org-admin**: 组织管理权限（排除 organization:delete）
- **org-member**: 组织查看权限

## 使用场景

### 场景 1：使用全局角色

```typescript
// 用户注册时分配全局角色
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'User',
    role: 'user', // better-auth 管理的全局角色
  }
})
```

### 场景 2：基于模板创建组织角色

```typescript
// 1. 获取组织角色模板
const template = await prisma.role.findUnique({
  where: { name: 'org-admin' },
  include: {
    rolePermissions: {
      include: { permission: true }
    }
  }
})

// 2. 为组织创建角色（基于模板）
const orgRole = await prisma.organizationRole.create({
  data: {
    organizationId: 'org-123',
    templateRoleId: template.id,
    role: 'admin', // 组织内的角色名
    displayName: '管理员',
    description: '组织管理员',
    isActive: true,
  }
})

// 3. 复制模板权限到组织角色
for (const rp of template.rolePermissions) {
  await prisma.organizationRolePermission.create({
    data: {
      organizationRoleId: orgRole.id,
      permissionId: rp.permissionId,
      dataScope: rp.dataScope,
    }
  })
}

// 4. 分配成员到角色
await prisma.member.update({
  where: { id: 'member-123' },
  data: {
    organizationRoleId: orgRole.id,
    role: 'admin', // better-auth 兼容字段
  }
})
```

### 场景 3：为组织角色添加自定义权限

```typescript
// 1. 获取权限
const permission = await prisma.permission.findUnique({
  where: { code: 'member:export' }
})

// 2. 为组织角色添加额外权限
await prisma.organizationRolePermission.create({
  data: {
    organizationRoleId: orgRole.id,
    permissionId: permission.id,
    dataScope: 'ORG',
  }
})
```

### 场景 4：创建完全自定义的组织角色

```typescript
// 不基于模板，完全自定义
const customRole = await prisma.organizationRole.create({
  data: {
    organizationId: 'org-123',
    templateRoleId: null, // 不使用模板
    role: 'custom-reviewer',
    displayName: '内容审核员',
    description: '负责审核组织内容',
    isActive: true,
  }
})

// 手动分配权限
const permissions = await prisma.permission.findMany({
  where: {
    code: {
      in: ['question:read', 'question:update', 'question:approve']
    }
  }
})

for (const permission of permissions) {
  await prisma.organizationRolePermission.create({
    data: {
      organizationRoleId: customRole.id,
      permissionId: permission.id,
      dataScope: 'ORG',
    }
  })
}
```

## 权限检查逻辑

### 1. 全局角色权限检查

```typescript
// 检查用户的全局角色权限
async function checkGlobalPermission(userId: string, permissionCode: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // 通过 better-auth 的 role 字段
    }
  })
  
  if (!user?.role) return false
  
  // 查询角色权限
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role: {
        name: user.role
      },
      permission: {
        code: permissionCode
      }
    }
  })
  
  return !!rolePermission
}
```

### 2. 组织角色权限检查

```typescript
// 检查用户在组织中的权限
async function checkOrgPermission(
  userId: string, 
  organizationId: string, 
  permissionCode: string
) {
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId
    },
    include: {
      organizationRole: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })
  
  if (!member?.organizationRole) return false
  
  // 检查组织角色的权限
  const hasPermission = member.organizationRole.permissions.some(
    rp => rp.permission.code === permissionCode
  )
  
  return hasPermission
}
```

## API 实现（ServerFn）

### 已实现的 ServerFn

#### 1. 角色管理 (`rbac.fn.ts`)

```typescript
import { 
  getRolesFn, 
  getRoleFn, 
  createRoleFn, 
  updateRoleFn, 
  deleteRoleFn,
  assignPermissionsFn,
  getPermissionMatrixFn
} from '@/modules/system-admin/shared/server-fns/rbac.fn'

// 获取角色列表
const roles = await getRolesFn()

// 获取单个角色
const role = await getRoleFn({ data: { id: 'role-id' } })

// 创建角色
const newRole = await createRoleFn({
  data: {
    name: 'content-manager',
    displayName: '内容管理员',
    description: '管理内容相关功能',
    scope: 'CUSTOM',
    permissionIds: ['perm-1', 'perm-2'],
  }
})

// 更新角色
await updateRoleFn({
  data: {
    id: 'role-id',
    displayName: '新名称',
    isActive: true,
  }
})

// 删除角色
await deleteRoleFn({ data: { id: 'role-id' } })

// 分配权限
await assignPermissionsFn({
  data: {
    roleId: 'role-id',
    permissionIds: ['perm-1', 'perm-2', 'perm-3'],
  }
})

// 获取权限矩阵
const matrix = await getPermissionMatrixFn()
```

#### 2. 资源管理 (`rbac.fn.ts`)

```typescript
import {
  getResourcesFn,
  createResourceFn,
  updateResourceFn,
  deleteResourceFn
} from '@/modules/system-admin/shared/server-fns/rbac.fn'

// 获取资源列表
const resources = await getResourcesFn()

// 创建资源
const resource = await createResourceFn({
  data: {
    name: 'article',
    displayName: '文章',
    description: '文章管理',
    scope: 'BOTH',
  }
})

// 更新资源
await updateResourceFn({
  data: {
    id: 'resource-id',
    displayName: '新名称',
  }
})

// 删除资源
await deleteResourceFn({ data: { id: 'resource-id' } })
```

#### 3. 操作管理 (`rbac.fn.ts`)

```typescript
import {
  getActionsFn,
  createActionFn,
  updateActionFn,
  deleteActionFn
} from '@/modules/system-admin/shared/server-fns/rbac.fn'

// 获取操作列表
const actions = await getActionsFn({ data: { resourceId: 'resource-id' } })

// 创建操作
const action = await createActionFn({
  data: {
    resourceId: 'resource-id',
    name: 'publish',
    displayName: '发布',
    description: '发布文章',
  }
})
```

#### 4. 权限管理 (`rbac.fn.ts`)

```typescript
import {
  getPermissionsFn,
  createPermissionFn,
  updatePermissionFn,
  deletePermissionFn
} from '@/modules/system-admin/shared/server-fns/rbac.fn'

// 获取权限列表
const permissions = await getPermissionsFn()

// 创建权限
const permission = await createPermissionFn({
  data: {
    resourceId: 'resource-id',
    actionId: 'action-id',
    displayName: '发布文章',
    description: '允许发布文章',
    category: '内容管理',
  }
})
```

#### 5. 组织角色管理 (`organization-role.fn.ts`)

```typescript
import {
  getOrganizationRolesFn,
  getOrganizationRoleFn,
  createOrganizationRoleFn,
  updateOrganizationRoleFn,
  deleteOrganizationRoleFn,
  assignOrganizationRolePermissionsFn,
  getOrganizationRolePermissionsFn,
  getRoleTemplatesFn
} from '@/modules/system-admin/shared/server-fns/organization-role.fn'

// 获取组织角色列表
const { data, pagination } = await getOrganizationRolesFn({
  data: {
    organizationId: 'org-123',
    page: 1,
    pageSize: 10,
    search: '管理',
    isActive: true,
  }
})

// 获取角色模板列表
const templates = await getRoleTemplatesFn()

// 基于模板创建组织角色
const orgRole = await createOrganizationRoleFn({
  data: {
    organizationId: 'org-123',
    role: 'admin',
    displayName: '管理员',
    description: '组织管理员',
    templateRoleId: 'template-id',
    copyTemplatePermissions: true,
  }
})

// 创建自定义组织角色
const customRole = await createOrganizationRoleFn({
  data: {
    organizationId: 'org-123',
    role: 'reviewer',
    displayName: '审核员',
    description: '内容审核员',
    // 不指定 templateRoleId，完全自定义
  }
})

// 为组织角色分配权限
await assignOrganizationRolePermissionsFn({
  data: {
    organizationRoleId: 'org-role-id',
    permissionIds: ['perm-1', 'perm-2'],
    dataScope: 'ORG',
  }
})

// 获取组织角色的权限
const permissions = await getOrganizationRolePermissionsFn({
  data: { organizationRoleId: 'org-role-id' }
})
```

### 2. 前端界面

需要实现以下管理界面：

- **角色管理页面**
  - 角色列表（支持筛选：全局/组织/自定义）
  - 角色创建/编辑表单
  - 角色权限分配界面（树形选择）

- **权限管理页面**
  - 权限列表（按资源分组）
  - 权限详情查看

- **组织角色管理页面**
  - 组织角色实例列表
  - 基于模板创建角色
  - 自定义角色权限配置

### 3. 权限检查中间件

实现统一的权限检查中间件，集成到现有的 `requirePermission` 函数中。

## 数据库查询示例

### 查询用户的所有权限

```typescript
// 全局权限 + 组织权限
async function getUserPermissions(userId: string, organizationId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  // 1. 全局角色权限
  const globalPermissions = await prisma.rolePermission.findMany({
    where: {
      role: {
        name: user?.role
      }
    },
    include: {
      permission: true
    }
  })
  
  // 2. 组织角色权限
  let orgPermissions = []
  if (organizationId) {
    const member = await prisma.member.findFirst({
      where: { userId, organizationId },
      include: {
        organizationRole: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    })
    
    if (member?.organizationRole) {
      orgPermissions = member.organizationRole.permissions.map(
        rp => rp.permission
      )
    }
  }
  
  return {
    global: globalPermissions.map(rp => rp.permission),
    organization: orgPermissions
  }
}
```

### 查询角色的所有权限

```typescript
async function getRolePermissions(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
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
  
  return role?.rolePermissions.map(rp => ({
    ...rp.permission,
    dataScope: rp.dataScope,
    validFrom: rp.validFrom,
    validUntil: rp.validUntil
  }))
}
```

## 最佳实践

### 1. 角色设计原则

- **最小权限原则**：只分配必要的权限
- **角色分层**：全局角色 > 组织角色 > 自定义角色
- **模板复用**：优先使用角色模板，减少重复配置

### 2. 权限命名规范

- 使用 `resource:action` 格式
- 资源名使用单数形式
- 操作名使用动词原形

### 3. 数据范围控制

- 合理使用 `dataScope` 字段
- 组织内操作使用 `ORG` 范围
- 个人数据使用 `SELF` 范围

### 4. 性能优化

- 使用 Prisma 的 `include` 预加载关联数据
- 缓存用户权限列表（Redis）
- 使用索引优化查询

## 总结

已完成的工作：

1. ✅ 设计完整的 RBAC 数据模型
2. ✅ 支持全局角色、组织角色模板、自定义角色
3. ✅ 实现组织角色实例化机制
4. ✅ 支持权限继承和自定义权限
5. ✅ 生成数据库迁移
6. ✅ 初始化系统角色、资源、操作、权限数据
7. ✅ 为系统角色分配默认权限

待完成的工作：

1. ⏳ 实现角色管理 API
2. ⏳ 实现资源和操作管理 API
3. ⏳ 实现权限管理 API
4. ⏳ 实现组织角色实例管理 API
5. ⏳ 更新前端角色管理界面
6. ⏳ 添加权限分配界面
7. ⏳ 集成权限检查中间件

系统已具备完整的 RBAC 数据基础，可以开始实现管理功能和前端界面。
