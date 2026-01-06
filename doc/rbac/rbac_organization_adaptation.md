# RBAC 适配现有 Organization/Member 方案

## 📋 现有模型分析

### 您已有的模型：

```prisma
model Organization {
  id          String       @id
  name        String
  slug        String?
  logo        String?
  createdAt   DateTime
  metadata    String?
  members     Member[]
  invitations Invitation[]
}

model Member {
  id             String       @id
  organizationId String
  organization   Organization @relation(...)
  userId         String
  user           User         @relation(...)
  role           String       // 这里是字符串角色
  createdAt      DateTime
}
```

### 优势：
- ✅ 已有组织架构基础
- ✅ 用户-组织关联已建立
- ✅ 支持多组织（SaaS 场景）

---

## 🔄 适配方案

### 方案选择：**混合模式**

**Organization** 用于：
- 多租户隔离
- 顶层组织管理
- 跨组织权限控制

**Department**（新增）用于：
- 组织内部层级结构
- 部门数据范围控制
- 细粒度权限管理

---

## 💾 调整后的数据库设计

### 1. 扩展 Organization 和 Member

```prisma
// 保持原有 Organization 不变
model Organization {
  id          String       @id
  name        String
  slug        String?
  logo        String?
  createdAt   DateTime
  metadata    String?
  members     Member[]
  invitations Invitation[]
  
  // 新增：组织内的部门
  departments Department[]
  
  @@unique([slug])
  @@map("organization")
}

// 扩展 Member 模型
model Member {
  id             String       @id
  organizationId String
  organization   Organization @relation(...)
  userId         String
  user           User         @relation(...)
  
  // 保留字符串角色（向后兼容）
  role           String
  
  // 新增：关联到 SystemRole（新权限系统）
  systemRoleId   String?
  systemRole     SystemRole?  @relation(fields: [systemRoleId], references: [id])
  
  // 新增：部门关联
  departmentId   String?
  department     Department?  @relation(fields: [departmentId], references: [id])
  
  createdAt      DateTime
  
  @@map("member")
}
```

### 2. 新增 Department 模型

```prisma
// 部门表（组织内部结构）
model Department {
  id             String   @id @default(cuid())
  name           String   // 部门名称
  code           String   // 部门编码
  
  // 所属组织
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // 树形结构
  parentId       String?
  parent         Department?  @relation("DepartmentTree", fields: [parentId], references: [id])
  children       Department[] @relation("DepartmentTree")
  
  level          Int      @default(1) // 层级
  sort           Int      @default(0) // 排序
  leader         String?  // 负责人
  phone          String?
  email          String?
  status         String   @default("ACTIVE")
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // 关联
  members        Member[]
  
  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([parentId])
  @@map("departments")
}
```

### 3. 权限系统（保持不变）

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String
  description String?
  resource    String
  action      String
  category    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  rolePermissions RolePermission[]
  fieldPermissions FieldPermission[]
  
  @@index([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  
  // 数据范围（适配组织+部门）
  dataScope    String   @default("ALL")
  // ALL - 全部数据
  // ORG - 本组织
  // DEPT - 本部门
  // DEPT_AND_SUB - 本部门及下级
  // SELF - 仅本人
  
  customScope  Json?
  
  // 时间限制
  validFrom    DateTime?
  validUntil   DateTime?
  timeRanges   Json?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  role         SystemRole  @relation(...)
  permission   Permission  @relation(...)
  
  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// 扩展 SystemRole
model SystemRole {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String
  description String?
  isSystem    Boolean  @default(false)
  
  // 新增：角色作用域
  scope       String   @default("GLOBAL") // GLOBAL, ORG, DEPT
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]   @relation("UserToSystemRole")
  members     Member[] // 新增：Member 关联
  navGroups   RoleNavGroup[]
  permissions RolePermission[]
  crossOrgAccess CrossOrgAccess[]
  
  @@map("system_role")
}
```

### 4. 跨组织访问（替代跨部门访问）

```prisma
// 跨组织访问授权表
model CrossOrgAccess {
  id              String   @id @default(cuid())
  roleId          String
  sourceOrgId     String   // 源组织
  targetOrgId     String   // 目标组织
  resource        String   // 资源类型
  accessLevel     String   // READ, WRITE, FULL
  
  // 可选：部门级别限制
  sourceDeptId    String?
  targetDeptId    String?
  
  validFrom       DateTime?
  validUntil      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  role            SystemRole @relation(...)
  
  @@unique([roleId, sourceOrgId, targetOrgId, resource])
  @@map("cross_org_access")
}
```

---

## 🎯 数据范围适配

### 新的数据范围层级

```typescript
enum DataScope {
  ALL = 'ALL',               // 全部数据（超级管理员）
  ORG = 'ORG',               // 本组织所有数据
  DEPT = 'DEPT',             // 本部门数据
  DEPT_AND_SUB = 'DEPT_AND_SUB', // 本部门及下级部门
  SELF = 'SELF'              // 仅本人数据
}
```

### 数据过滤逻辑

```typescript
// server/utils/data-scope-filter.ts
export async function applyDataScopeFilter(
  userId: string,
  resource: string,
  baseQuery: any
) {
  // 1. 获取用户的组织和部门信息
  const member = await prisma.member.findFirst({
    where: { userId },
    include: {
      organization: true,
      department: true,
      systemRole: {
        include: {
          permissions: {
            where: {
              permission: { resource }
            }
          }
        }
      }
    }
  })
  
  if (!member) return baseQuery
  
  // 2. 获取数据范围
  const dataScope = member.systemRole?.permissions[0]?.dataScope || 'SELF'
  
  // 3. 应用过滤
  switch (dataScope) {
    case 'ALL':
      // 超级管理员，不过滤
      return baseQuery
      
    case 'ORG':
      // 本组织所有数据
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          organizationId: member.organizationId
        }
      }
      
    case 'DEPT':
      // 本部门数据
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          organizationId: member.organizationId,
          departmentId: member.departmentId
        }
      }
      
    case 'DEPT_AND_SUB':
      // 本部门及下级部门
      const subDepts = await getSubDepartments(member.departmentId)
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          organizationId: member.organizationId,
          departmentId: {
            in: [member.departmentId, ...subDepts.map(d => d.id)]
          }
        }
      }
      
    case 'SELF':
      // 仅本人
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          userId: userId
        }
      }
      
    default:
      return baseQuery
  }
}
```

---

## 🔄 迁移策略

### Phase 1: 向后兼容（不破坏现有功能）

1. **保留 Member.role 字符串字段**
   - 现有代码继续工作
   - 逐步迁移到 SystemRole

2. **添加可选字段**
   ```prisma
   systemRoleId String?  // 可选
   departmentId String?  // 可选
   ```

3. **双轨运行**
   ```typescript
   // 优先使用新系统，回退到旧系统
   const role = member.systemRole?.name || member.role
   ```

### Phase 2: 数据迁移

```typescript
// 迁移脚本
async function migrateRoles() {
  // 1. 创建对应的 SystemRole
  const adminRole = await prisma.systemRole.create({
    data: {
      name: 'org_admin',
      label: '组织管理员',
      scope: 'ORG'
    }
  })
  
  // 2. 更新 Member
  await prisma.member.updateMany({
    where: { role: 'admin' },
    data: { systemRoleId: adminRole.id }
  })
}
```

### Phase 3: 逐步启用新功能

1. 先启用部门管理
2. 再启用权限系统
3. 最后启用字段级权限

---

## 📝 实施计划（调整）

### Phase 1: 数据库扩展（1-2天）
- [x] 创建 Department 表
- [x] 扩展 Member 表（添加 systemRoleId, departmentId）
- [x] 创建 Permission, RolePermission 表
- [x] 保持向后兼容

### Phase 2: 部门管理（1-2天）
- [ ] 部门 CRUD API
- [ ] 部门树组件
- [ ] 部门选择器
- [ ] Member 关联部门

### Phase 3: 角色迁移（1天）
- [ ] 创建默认 SystemRole
- [ ] 数据迁移脚本
- [ ] 双轨运行测试

### Phase 4: 权限系统（2-3天）
- [ ] 权限 CRUD API
- [ ] 角色权限配置界面
- [ ] 数据范围过滤
- [ ] 前端权限 Hook

### Phase 5: 字段级权限（2天）
- [ ] FieldPermission 表
- [ ] 字段权限配置
- [ ] 前后端集成

### Phase 6: 时间和跨组织（1-2天）
- [ ] 时间限制
- [ ] 跨组织访问

**总计：8-12 天**

---

## ✅ 优势

1. **无缝集成**
   - 复用现有 Organization/Member
   - 不破坏现有功能
   - 平滑迁移

2. **灵活性**
   - 支持多组织（SaaS）
   - 支持组织内部门
   - 支持跨组织访问

3. **可扩展**
   - 可以只用组织级别
   - 可以添加部门级别
   - 可以精细到字段级别

4. **向后兼容**
   - 保留 Member.role 字符串
   - 逐步迁移
   - 风险可控
