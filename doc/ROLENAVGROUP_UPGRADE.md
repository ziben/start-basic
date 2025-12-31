# 🎯 RoleNavGroup 升级速查

## ✅ 已完成

将 `RoleNavGroup` 从 `roleName` (字符串) 升级到 `roleId` (外键)

## 📊 对比

| 方面 | 旧方案 (roleName) | 新方案 (roleId) |
|------|------------------|----------------|
| 数据类型 | String | Foreign Key |
| 约束 | ❌ 无 | ✅ 外键约束 |
| 角色改名 | ❌ 需手动更新 | ✅ 自动同步 |
| 角色删除 | ❌ 留下脏数据 | ✅ 级联删除 |
| 类型安全 | ⚠️ 部分 | ✅ 完整 |

## 🔧 修改的函数

### 1. `createNavGroup`
```typescript
// 现在会查询 SystemRole 获取 ID
const systemRoles = await tx.systemRole.findMany({
  where: { name: { in: data.roles } }
})

await tx.roleNavGroup.createMany({
  data: systemRoles.map(role => ({
    roleId: role.id,  // ✅ 使用 ID
    navGroupId: group.id
  }))
})
```

### 2. `updateNavGroup`
```typescript
// 同样使用 roleId
const systemRoles = await tx.systemRole.findMany({
  where: { name: { in: data.roles } }
})

await tx.roleNavGroup.createMany({
  data: systemRoles.map(role => ({
    roleId: role.id,
    navGroupId: id
  }))
})
```

### 3. 所有查询
```typescript
// 现在包含完整的角色信息
include: {
  roleNavGroups: {
    include: {
      systemRole: true  // ✅ 角色详情
    }
  }
}
```

## 📦 返回数据结构

```json
{
  "id": "group-1",
  "title": "Dashboard",
  "roleNavGroups": [
    {
      "id": "rng-1",
      "roleId": "role-123",
      "systemRole": {
        "id": "role-123",
        "name": "admin",
        "label": "管理员",
        "description": "系统超级管理员"
      }
    }
  ]
}
```

## ✨ 优势

1. **数据完整性** - 外键确保角色存在
2. **自动同步** - 角色改名自动更新
3. **级联删除** - 删除角色自动清理关联
4. **类型安全** - TypeScript 完整支持

## 🧪 测试

```bash
# 创建导航组
POST /api/admin/navgroup/
{
  "title": "Test",
  "roles": ["admin", "user"]
}

# ✅ 成功：返回包含 systemRole 的完整数据
```

## 📝 注意事项

- ✅ 向后兼容：`roleName` 字段保留
- ✅ 新数据全部使用 `roleId`
- ⚠️ 如果角色不存在，关联不会创建（静默失败）

## 📚 完整文档

查看 `ROLENAVGROUP_FIX.md` 了解详细信息
