# 基于角色的权限管理系统（RBAC）设计方案

## 📋 目标

实现一个完整的 RBAC 系统，支持：
- ✅ 菜单可见性控制（已实现）
- 🆕 数据操作权限（CRUD）
- 🆕 按钮/功能权限
- 🆕 数据范围权限（行级权限）
- 🆕 字段级权限（列级权限）
- 🆕 时间段权限（临时授权）
- 🆕 部门组织架构
- 🆕 跨部门数据访问

---

## 🏗️ 架构设计

### 1. 权限模型（四层结构）

```
用户 (User)
  ↓ 多对多
角色 (Role)
  ↓ 多对多
权限 (Permission)
  ↓ 关联
资源 (Resource)
```

### 2. 核心概念

#### **Permission（权限）**
权限是系统中最小的授权单元，定义了"谁可以对什么资源做什么操作"。

**权限命名规范：**
```
<resource>:<action>
```

**示例：**
- `user:create` - 创建用户
- `user:read` - 查看用户
- `user:update` - 更新用户
- `user:delete` - 删除用户
- `user:export` - 导出用户
- `role:assign` - 分配角色
- `menu:manage` - 管理菜单

#### **Resource（资源）**
资源是被保护的对象，可以是：
- 数据实体（User, Role, Order 等）
- 功能模块（Dashboard, Reports 等）
- 具体操作（Export, Import 等）

#### **Action（操作）**
标准 CRUD + 扩展操作：
- `create` - 创建
- `read` - 读取
- `update` - 更新
- `delete` - 删除
- `export` - 导出
- `import` - 导入
- `approve` - 审批
- `assign` - 分配

---

## 💾 数据库设计

### Prisma Schema

```prisma
// ==================== 组织架构 ====================

// 部门表
model Department {
  id          String   @id @default(cuid())
  name        String   // 部门名称
  code        String   @unique // 部门编码
  parentId    String?  // 父部门ID
  level       Int      @default(1) // 层级
  sort        Int      @default(0) // 排序
  leader      String?  // 负责人
  phone       String?  // 联系电话
  email       String?  // 邮箱
  status      String   @default("ACTIVE") // ACTIVE, INACTIVE
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  parent      Department?  @relation("DepartmentTree", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentTree")
  users       User[]
  
  @@index([parentId])
  @@map("departments")
}

// 扩展 User 表
model User {
  // ... 现有字段
  
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
}

// ==================== 权限系统 ====================

// 权限表
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique // 例如: user:create
  label       String   // 显示名称: 创建用户
  description String?  // 描述
  resource    String   // 资源: user
  action      String   // 操作: create
  category    String?  // 分类: 用户管理
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  rolePermissions RolePermission[]
  fieldPermissions FieldPermission[]
  
  @@index([resource, action])
  @@map("permissions")
}

// 角色-权限关联表（增强版）
model RolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  
  // 数据范围限制
  dataScope    String   @default("ALL") // ALL, DEPT, DEPT_AND_SUB, SELF, CUSTOM
  customScope  Json?    // 自定义范围条件
  
  // 时间限制
  validFrom    DateTime? // 生效时间
  validUntil   DateTime? // 失效时间
  timeRanges   Json?     // 时间段限制 [{day: 1-7, start: "09:00", end: "18:00"}]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  role         SystemRole  @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission  @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}

// 字段级权限表
model FieldPermission {
  id           String   @id @default(cuid())
  permissionId String
  resource     String   // 资源: user
  field        String   // 字段: salary, phone
  access       String   // READ, WRITE, HIDDEN
  condition    Json?    // 条件: {role: 'admin'}
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([permissionId, resource, field])
  @@index([resource, field])
  @@map("field_permissions")
}

// 跨部门访问授权表
model CrossDepartmentAccess {
  id              String   @id @default(cuid())
  roleId          String
  sourceDeptId    String   // 源部门
  targetDeptId    String   // 目标部门
  resource        String   // 资源类型
  accessLevel     String   // READ, WRITE, FULL
  
  // 时间限制
  validFrom       DateTime?
  validUntil      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  role            SystemRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, sourceDeptId, targetDeptId, resource])
  @@index([roleId])
  @@map("cross_department_access")
}

// 扩展现有的 SystemRole
model SystemRole {
  // ... 现有字段
  
  // 新增关联
  permissions           RolePermission[]
  crossDepartmentAccess CrossDepartmentAccess[]
}
```

### 数据范围说明

```typescript
enum DataScope {
  ALL = 'ALL',           // 全部数据
  DEPT = 'DEPT',         // 本部门数据
  DEPT_AND_SUB = 'DEPT_AND_SUB', // 本部门及下级部门
  SELF = 'SELF',         // 仅本人数据
  CUSTOM = 'CUSTOM'      // 自定义范围
}
```

---

## 🔧 技术实现

### 1. 权限检查 Hook

```typescript
// hooks/use-permission.ts
export function usePermission() {
  const { user } = useAuth()
  
  /**
   * 检查是否有某个权限
   */
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    
    // 从用户的角色中获取所有权限
    const permissions = user.roles.flatMap(role => 
      role.permissions.map(p => p.permission.name)
    )
    
    return permissions.includes(permission)
  }, [user])
  
  /**
   * 检查是否有任一权限
   */
  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }, [hasPermission])
  
  /**
   * 检查是否有所有权限
   */
  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(p => hasPermission(p))
  }, [hasPermission])
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
```

### 2. 权限组件

```typescript
// components/permission-guard.tsx
interface PermissionGuardProps {
  permission: string | string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ 
  permission, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermission()
  
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission)
  
  if (!allowed) return <>{fallback}</>
  
  return <>{children}</>
}
```

### 3. 按钮权限控制

```typescript
// 使用示例
<PermissionGuard permission="user:create">
  <Button onClick={handleCreate}>创建用户</Button>
</PermissionGuard>

<PermissionGuard permission={["user:update", "user:delete"]}>
  <Button onClick={handleEdit}>编辑</Button>
</PermissionGuard>
```

### 4. 服务端权限检查

```typescript
// server/middleware/require-permission.ts
export function requirePermission(permission: string) {
  return async (context: any) => {
    const user = await getAuthUser(context)
    
    if (!user) {
      throw new Error('未登录')
    }
    
    const hasPermission = await checkUserPermission(user.id, permission)
    
    if (!hasPermission) {
      throw new Error(`缺少权限: ${permission}`)
    }
    
    return user
  }
}

// 使用示例
export const createUserFn = createServerFn({ method: 'POST' })
  .middleware(requirePermission('user:create'))
  .handler(async ({ data }) => {
    // 创建用户逻辑
  })
```

### 5. 数据范围过滤

```typescript
// server/utils/data-scope-filter.ts
export async function applyDataScopeFilter(
  userId: string,
  resource: string,
  baseQuery: any
) {
  const userRoles = await getUserRoles(userId)
  
  // 获取该资源的数据范围
  const dataScopes = userRoles.flatMap(role =>
    role.permissions
      .filter(p => p.permission.resource === resource)
      .map(p => p.dataScope)
  )
  
  // 如果有 ALL 权限，返回原查询
  if (dataScopes.includes('ALL')) {
    return baseQuery
  }
  
  // 如果只有 SELF 权限，添加用户过滤
  if (dataScopes.includes('SELF')) {
    return {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        createdById: userId
      }
    }
  }
  
  // 如果有 DEPT 权限，添加部门过滤
  if (dataScopes.includes('DEPT')) {
    const userDept = await getUserDepartment(userId)
    return {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        departmentId: userDept.id
      }
    }
  }
  
  // 默认返回空结果
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      id: 'impossible-id'
    }
  }
}
```

---

## 📱 前端集成

### 1. 权限配置界面

**角色管理页面增强：**
```
角色列表
├─ 基本信息
├─ 菜单权限（已有）
└─ 功能权限（新增）
    ├─ 按资源分组
    ├─ 批量选择
    └─ 数据范围配置
```

### 2. 权限树组件

```typescript
// 权限树结构
{
  "用户管理": {
    "user:create": "创建用户",
    "user:read": "查看用户",
    "user:update": "编辑用户",
    "user:delete": "删除用户",
    "user:export": "导出用户"
  },
  "角色管理": {
    "role:create": "创建角色",
    "role:read": "查看角色",
    "role:update": "编辑角色",
    "role:delete": "删除角色",
    "role:assign": "分配权限"
  }
}
```

### 3. 表格操作列权限控制

```typescript
// 示例：用户列表操作列
{
  id: 'actions',
  cell: ({ row }) => (
    <div className="flex gap-2">
      <PermissionGuard permission="user:update">
        <Button onClick={() => handleEdit(row)}>编辑</Button>
      </PermissionGuard>
      
      <PermissionGuard permission="user:delete">
        <Button onClick={() => handleDelete(row)}>删除</Button>
      </PermissionGuard>
      
      <PermissionGuard permission="user:reset-password">
        <Button onClick={() => handleResetPassword(row)}>
          重置密码
        </Button>
      </PermissionGuard>
    </div>
  )
}
```

---

## 🎯 实施步骤

### Phase 1: 基础权限系统（1-2天）

1. ✅ 创建 Permission 和 RolePermission 表
2. ✅ 实现权限 CRUD API
3. ✅ 创建权限种子数据
4. ✅ 实现 `usePermission` Hook
5. ✅ 实现 `PermissionGuard` 组件

### Phase 2: 角色权限配置（1天）

1. ✅ 在角色管理页面添加"功能权限"标签页
2. ✅ 实现权限树组件
3. ✅ 实现权限分配 API
4. ✅ 实现数据范围配置

### Phase 3: 前端集成（1-2天）

1. ✅ 在现有页面添加按钮权限控制
2. ✅ 在表格操作列添加权限控制
3. ✅ 测试各种权限组合

### Phase 4: 后端集成（1-2天）

1. ✅ 实现服务端权限中间件
2. ✅ 在所有 ServerFn 添加权限检查
3. ✅ 实现数据范围过滤
4. ✅ 测试 API 权限

### Phase 5: 优化和文档（1天）

1. ✅ 性能优化（缓存权限）
2. ✅ 错误处理优化
3. ✅ 编写开发文档
4. ✅ 编写用户手册

---

## 🔐 权限预设方案

### 超级管理员（Super Admin）
```typescript
{
  name: "超级管理员",
  permissions: ["*:*"], // 所有权限
  dataScope: "ALL"
}
```

### 普通管理员（Admin）
```typescript
{
  name: "管理员",
  permissions: [
    "user:read", "user:create", "user:update",
    "role:read",
    "menu:read"
  ],
  dataScope: "DEPT"
}
```

### 普通用户（User）
```typescript
{
  name: "普通用户",
  permissions: [
    "user:read",
    "profile:update"
  ],
  dataScope: "SELF"
}
```

---

## 🚀 优势

1. **灵活性高**
   - 细粒度控制
   - 易于扩展
   - 支持复杂场景

2. **易于维护**
   - 权限集中管理
   - 清晰的命名规范
   - 代码复用性高

3. **性能优化**
   - 可以缓存用户权限
   - 减少数据库查询
   - 支持批量检查

4. **用户体验好**
   - 按钮自动隐藏/禁用
   - 清晰的权限提示
   - 避免无权限操作

---

## ⚠️ 注意事项

1. **权限粒度**
   - 不要过细（维护成本高）
   - 不要过粗（不够灵活）
   - 建议：资源级别 + 操作级别

2. **性能考虑**
   - 缓存用户权限（Redis/内存）
   - 避免每次请求都查数据库
   - 使用权限位图优化

3. **安全性**
   - 前端权限只控制 UI
   - 后端必须验证所有操作
   - 敏感操作需要二次验证

4. **向后兼容**
   - 保留现有菜单权限系统
   - 逐步迁移到新系统
   - 提供迁移工具

---

## 📚 参考资料

- [RBAC 标准](https://en.wikipedia.org/wiki/Role-based_access_control)
- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [Casbin](https://casbin.org/) - 权限管理库参考
