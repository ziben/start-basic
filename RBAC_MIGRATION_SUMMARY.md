# RBAC 重构总结

## 已完成的核心重构

### 1. ✅ Auth 配置 (auth.ts)
- 使用 `createAccessControl` 定义权限声明
- 定义 3 个全局角色：superadmin, admin, user
- 配置 organization 插件（启用 teams）

### 2. ✅ Prisma Schema
- 移除 `SystemRole` 表
- 保留 `User.role` (better-auth 管理)
- 保留 `Member.role` (organization 插件管理)
- 更新 `RoleNavGroup.role` 为字符串
- 更新 `RolePermission.role` 为字符串
- 更新 `CrossOrgAccess.role` 为字符串

### 3. ✅ 权限检查逻辑 (permission-check.ts)
- `checkGlobalPermission`: 检查全局角色权限
- `checkOrgPermission`: 检查组织角色权限
- `checkCustomPermission`: 检查自定义细粒度权限
- `getUserPermissions`: 获取用户所有权限

### 4. ✅ 核心服务层
- **role.service.ts**: 基于配置的角色管理，不再查询数据库
- **navgroup.service.ts**: 移除 systemRole 关联
- **user.service.ts**: 移除 systemRoles 字段

### 5. ✅ 组件更新
- **system-role-selector.tsx**: 重写为基于配置的角色选择器
- **sidebar/server-utils.ts**: 简化角色匹配逻辑

## 剩余待处理文件

### 需要更新的组件
1. `features/identity/roles/components/admin-roles-columns.tsx`
2. `features/identity/roles/context/roles-context.tsx`
3. `features/organization/members/components/member-mutate-dialog.tsx`
4. `features/organization/members/components/members-columns.tsx`
5. `features/identity/users/components/admin-users-columns.tsx`
6. `features/navigation/navgroup/components/navgroups-columns.tsx`

### 需要修复的类型错误
- sidebar/server-utils.ts: 移除 roleName 字段引用
- 各种组件中的 SystemRole 类型引用

## 角色系统说明

### 全局角色 (User.role)
- `superadmin`: 超级管理员，所有权限
- `admin`: 管理员，用户/组织/角色/权限管理
- `user`: 普通用户，个人资料管理

### 组织角色 (Member.role)
- `owner`: 组织所有者
- `admin`: 组织管理员
- `member`: 组织成员

### 权限格式
- 格式: `resource:action`
- 示例: `user:create`, `org:read`, `profile:update`
- 通配符: `*` (所有权限), `org:*` (组织所有操作)

## 下一步行动
1. 批量更新剩余组件文件
2. 修复所有类型错误
3. 测试权限检查功能
4. 测试角色管理功能
