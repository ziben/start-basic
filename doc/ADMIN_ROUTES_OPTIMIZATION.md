# Admin 路由配置优化总结

## 优化内容

### 1. 删除冗余路由
删除了以下只做重定向的冗余路由文件：
- `src/routes/admin/navgroup.tsx` - 重定向到 `/admin/navigation?tab=groups`
- `src/routes/admin/navitem.tsx` - 重定向到 `/admin/navigation?tab=items`

这些路由的功能已经被 `navigation.tsx` 统一处理。

### 2. 重构为全局管理模式（方案 3）
将组织、成员、邀请从嵌套路由改为独立的全局管理模块：

**旧结构（嵌套）：**
```
/admin/organization/          # 组织列表
/admin/organization/create
/admin/organization/$id
/admin/organization/member    # ❌ 语义不清
/admin/organization/invitation # ❌ 语义不清
```

**新结构（全局）：**
```
/admin/organizations/         # 组织列表（复数）
/admin/organizations/create
/admin/organizations/$id
/admin/members/              # 全局成员管理（复数）
/admin/members/create
/admin/members/$id
/admin/invitations/          # 全局邀请管理（复数）
```

### 3. 统一组件导出方式
- `department.tsx`: 移除了 `RouteComponent` 包装，直接使用 `DepartmentPage` 组件
- 所有路由文件现在都直接导出组件，保持一致性

### 4. 统一 Search Schema
创建了通用的 `tableSearchSchema` (`src/shared/schemas/search-params.schema.ts`)，包含：
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 10）
- `filter`: 过滤文本
- `sortBy`: 排序字段
- `sortDir`: 排序方向（asc/desc）

已为以下路由添加统一的 search schema 验证：
- `/admin/users`
- `/admin/roles`
- `/admin/organizations`
- `/admin/members`
- `/admin/invitations`
- `/admin/department`
- `/admin/log`
- `/admin/account`
- `/admin/session`
- `/admin/translation`
- `/admin/verification`
- `/admin/rolenavgroup`
- `/admin/userrolenavgroup`

## 当前路由结构

```
/admin
├── /                      - 管理后台首页
├── /users                 - 用户管理
├── /roles                 - 角色管理
├── /department            - 部门管理
├── /organizations         - 组织管理（全局）
│   ├── /                  - 组织列表
│   ├── /create            - 创建组织
│   └── /$id               - 组织详情
├── /members               - 成员管理（全局）
│   ├── /                  - 成员列表
│   ├── /create            - 添加成员
│   └── /$id               - 成员详情
├── /invitations           - 邀请管理（全局）
├── /navigation            - 导航管理（统一管理 groups 和 items）
├── /rolenavgroup          - 角色导航组关联
├── /userrolenavgroup      - 用户导航组关联
├── /account               - 账户管理
├── /session               - 会话管理
├── /translation           - 翻译管理
├── /verification          - 验证管理
└── /log                   - 日志管理
```

## 文件变更

### 新增文件
- `src/routes/admin/organizations.tsx` - 组织列表
- `src/routes/admin/organizations/$id.tsx` - 组织详情
- `src/routes/admin/organizations/create.tsx` - 创建组织
- `src/routes/admin/members.tsx` - 成员列表
- `src/routes/admin/members/$id.tsx` - 成员详情
- `src/routes/admin/members/create.tsx` - 添加成员
- `src/routes/admin/invitations.tsx` - 邀请列表
- `src/shared/schemas/search-params.schema.ts` - 通用搜索参数 schema

### 删除文件
- `src/routes/admin/organization/` - 整个目录及其所有文件
- `src/routes/admin/navgroup.tsx`
- `src/routes/admin/navitem.tsx`

### 修改文件
- `src/modules/system-admin/features/organization/organization/organization-page.tsx`
  - 路由路径: `/admin/organization/` → `/admin/organizations`
- `src/modules/system-admin/features/organization/member/member-page.tsx`
  - 路由路径: `/admin/organization/member` → `/admin/members`

## 注意事项

1. **类型生成**: 修改路由文件后，开发服务器会自动重新生成 `routeTree.gen.ts`
2. **Search Schema**: 所有表格页面现在都使用统一的 `tableSearchSchema`，确保 URL 参数一致性
3. **RESTful 规范**: 使用复数形式（organizations, members, invitations）符合 RESTful API 最佳实践
4. **语义清晰**: 每个路由都是独立的全局管理模块，语义明确

## 待处理

路由类型文件需要重新生成才能解决当前的 TypeScript 错误。重启开发服务器 (`pnpm dev`) 即可自动完成。
