# RoleNavGroup 升级：使用 roleId 替代 roleName

## 🎯 升级目标

将 `RoleNavGroup` 从使用 `roleName`（字符串）升级到使用 `roleId`（外键关联），以获得：
- ✅ 数据库外键约束
- ✅ 更好的数据完整性
- ✅ 角色改名自动同步
- ✅ 类型安全

## � 修改内容

### 1. `createNavGroup` 函数

#### 修改前
```typescript
// 创建角色关联
if (data.roles && data.roles.length > 0) {
  await tx.roleNavGroup.createMany({
    data: data.roles.map((roleName) => ({
      roleName,  // ❌ 使用字符串
      navGroupId: group.id,
    })),
  })
}
```

#### 修改后
```typescript
// 创建角色关联（使用 roleId）
if (data.roles && data.roles.length > 0) {
  // 查询角色 ID
  const systemRoles = await tx.systemRole.findMany({
    where: { name: { in: data.roles } },
  })

  if (systemRoles.length > 0) {
    await tx.roleNavGroup.createMany({
      data: systemRoles.map((role) => ({
        roleId: role.id,  // ✅ 使用外键
        navGroupId: group.id,
      })),
    })
  }
}
```

### 2. `updateNavGroup` 函数

#### 修改前
```typescript
// 更新角色关联
if (data.roles !== undefined) {
  await tx.roleNavGroup.deleteMany({
    where: { navGroupId: id },
  })

  if (data.roles.length > 0) {
    await tx.roleNavGroup.createMany({
      data: data.roles.map((roleName) => ({
        roleName,  // ❌ 使用字符串
        navGroupId: id,
      })),
    })
  }
}
```

#### 修改后
```typescript
// 更新角色关联（使用 roleId）
if (data.roles !== undefined) {
  await tx.roleNavGroup.deleteMany({
    where: { navGroupId: id },
  })

  if (data.roles.length > 0) {
    // 查询角色 ID
    const systemRoles = await tx.systemRole.findMany({
      where: { name: { in: data.roles } },
    })

    if (systemRoles.length > 0) {
      await tx.roleNavGroup.createMany({
        data: systemRoles.map((role) => ({
          roleId: role.id,  // ✅ 使用外键
          navGroupId: id,
        })),
      })
    }
  }
}
```

### 3. 查询优化 - 包含角色详情

所有查询现在都包含 `systemRole` 关联：

```typescript
// getAllNavGroups, getNavGroupById, createNavGroup, updateNavGroup
include: {
  navItems: {
    orderBy: { orderIndex: 'asc' },
  },
  roleNavGroups: {
    include: {
      systemRole: true,  // ✅ 包含角色详情
    },
  },
}
```

## 📊 数据结构对比

### 修改前（使用 roleName）

```json
{
  "id": "group-1",
  "title": "Dashboard",
  "roleNavGroups": [
    {
      "id": "rng-1",
      "roleName": "admin",  // ❌ 字符串，无外键约束
      "navGroupId": "group-1"
    }
  ]
}
```

### 修改后（使用 roleId）

```json
{
  "id": "group-1",
  "title": "Dashboard",
  "roleNavGroups": [
    {
      "id": "rng-1",
      "roleId": "role-123",  // ✅ 外键
      "navGroupId": "group-1",
      "systemRole": {        // ✅ 完整的角色信息
        "id": "role-123",
        "name": "admin",
        "label": "管理员",
        "description": "系统超级管理员"
      }
    }
  ]
}
```

## ✅ 优势

### 1. 数据完整性
```typescript
// ✅ 外键约束确保角色存在
// 如果角色不存在，创建会失败
await tx.roleNavGroup.create({
  data: {
    roleId: "non-existent-id",  // 会抛出错误
    navGroupId: group.id,
  }
})
```

### 2. 级联更新
```typescript
// ✅ 角色改名自动同步
await prisma.systemRole.update({
  where: { id: "role-123" },
  data: { name: "super-admin" }  // 所有关联自动更新
})
```

### 3. 级联删除
```typescript
// ✅ 删除角色时自动清理关联
await prisma.systemRole.delete({
  where: { id: "role-123" }
})
// roleNavGroup 中的关联记录会自动删除（onDelete: Cascade）
```

### 4. 类型安全
```typescript
// ✅ TypeScript 类型检查
const navGroup = await prisma.navGroup.findUnique({
  include: {
    roleNavGroups: {
      include: {
        systemRole: true  // TypeScript 知道这个字段的类型
      }
    }
  }
})

// navGroup.roleNavGroups[0].systemRole.name  // ✅ 类型安全
```

## 🔄 迁移现有数据

如果数据库中已有使用 `roleName` 的数据，需要迁移：

```typescript
// 迁移脚本示例
async function migrateRoleNavGroups() {
  const allRoleNavGroups = await prisma.roleNavGroup.findMany({
    where: {
      roleName: { not: null },
      roleId: null,
    }
  })

  for (const rng of allRoleNavGroups) {
    if (rng.roleName) {
      // 查找对应的角色
      const role = await prisma.systemRole.findUnique({
        where: { name: rng.roleName }
      })

      if (role) {
        // 更新为使用 roleId
        await prisma.roleNavGroup.update({
          where: { id: rng.id },
          data: {
            roleId: role.id,
            roleName: null,  // 清空旧字段
          }
        })
      } else {
        console.warn(`Role not found: ${rng.roleName}`)
      }
    }
  }
}
```

## 🧪 测试

### 测试用例 1: 创建导航组
```bash
POST /api/admin/navgroup/
{
  "title": "Test Group",
  "scope": "ADMIN",
  "roles": ["admin", "user"]
}

# 预期结果
{
  "id": "...",
  "title": "Test Group",
  "roleNavGroups": [
    {
      "roleId": "role-admin-id",
      "systemRole": {
        "name": "admin",
        "label": "管理员"
      }
    },
    {
      "roleId": "role-user-id",
      "systemRole": {
        "name": "user",
        "label": "普通用户"
      }
    }
  ]
}
```

### 测试用例 2: 更新导航组角色
```bash
PUT /api/admin/navgroup/{id}
{
  "roles": ["admin"]  // 只保留 admin
}

# 预期结果：user 角色关联被删除，只剩 admin
```

### 测试用例 3: 不存在的角色
```bash
POST /api/admin/navgroup/
{
  "title": "Test",
  "roles": ["non-existent-role"]
}

# 预期结果：成功创建，但 roleNavGroups 为空
# （因为查询不到对应的角色）
```

## � Schema 定义

```prisma
model RoleNavGroup {
  id         String   @id @default(cuid())
  roleName   String?  // 兼容旧数据，新数据不使用
  roleId     String?  // ✅ 现在使用这个字段
  systemRole SystemRole? @relation(fields: [roleId], references: [id], onDelete: Cascade)
  navGroupId String
  navGroup   NavGroup @relation(fields: [navGroupId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([roleId, navGroupId])
  @@map("role_nav_group")
}
```

## 🎉 总结

### 修改的文件
- ✅ `src/routes/api/admin/navgroup/index.ts`
  - `createNavGroup` - 使用 roleId
  - `updateNavGroup` - 使用 roleId
  - `getAllNavGroups` - 包含 systemRole
  - `getNavGroupById` - 包含 systemRole

### 改进点
1. ✅ **数据完整性** - 外键约束确保角色存在
2. ✅ **自动同步** - 角色改名/删除自动处理
3. ✅ **类型安全** - TypeScript 完整类型支持
4. ✅ **更好的查询** - 一次查询获取完整角色信息

### 向后兼容
- ✅ `roleName` 字段保留，用于兼容旧数据
- ✅ 新数据全部使用 `roleId`
- ✅ 可以逐步迁移旧数据

### 下一步
- 📝 考虑添加迁移脚本（如果有旧数据）
- 📝 更新前端代码以使用新的数据结构
- 📝 添加单元测试验证新逻辑
