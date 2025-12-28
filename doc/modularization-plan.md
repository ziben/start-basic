# 模块化改造实施方案（执行版）

## 目标
- 让项目从当前 `features/* + routes/*` 的组织方式，演进到 **模块化**：
  - 业务模块：`src/modules/<module>`
  - 跨模块共享：`src/shared/*`
  - 路由层：`src/routes/*` 仅做装配（不承载业务细节）
- 新增题库模块（Question Bank），覆盖：
  - `questions / categories / tags / import-export / practice / analytics`
- 后端继续使用当前方案：
  - BFF API：`src/routes/api/**`（TanStack Start server handlers）
  - DB：Prisma（SQLite/libsql）
- 鉴权策略：
  - 管理端 API：`withAdminAuth`
  - 普通用户 API：新增 `withAuth`

---

## 目录规范（最终形态）

### 全局（跨模块共享）
```
src/
  shared/
    components/
    hooks/
    lib/
    utils/
    types/
```

### 模块（业务域）
```
src/
  modules/
    <module>/
      index.ts                     # 模块 public API（统一出口）
      shared/
        components/
        hooks/
        services/
        types/
        utils/
      features/
        <feature>/
          components/
          hooks/
          services/
          types/
          utils/
          index.ts
```

---

## 依赖边界（必须遵守）
- `routes/*`：只负责装配
  - 只能 import：`modules/*` 的页面组件/公开 API
  - 禁止把业务逻辑写进 routes
- `modules/<module>/features/*`：
  - feature 内部随便 import 自己内部
  - **禁止** feature A 深度 import feature B 的内部实现
    - 允许：通过 `modules/<module>/index.ts` 或 `modules/<module>/shared/*` 暴露的稳定 API 交互
- `modules/<module>/shared/*`：
  - 只放该模块内部共享的能力（不跨模块）
- `src/shared/*`：
  - 只放跨模块通用能力（DataTable、useTableUrlState 等）

---

## 题库模块（question-bank）设计决策

### 路由
- 前端：`/question-bank/*`
- API：`/api/question-bank/*`

### 数据模型（已确认）
- **categories：树**（`parentId + depth`）
- **tags：多对多**（`QuestionTag` join）
- **practice：普通用户可用**（走 `withAuth`）
- **模块级共享：需要**（表格 URL 状态、query keys、树工具等在模块 shared）

---

## 题库模块目录（modules/question-bank）

```
src/modules/question-bank/
  index.ts
  shared/
    query-keys.ts
    hooks/
      use-qb-table-url-state.ts
    services/
      qb-api-client.ts
    types/
      page.ts
    utils/
      category-tree.ts
  features/
    questions/
    categories/
    tags/
    import-export/
    practice/
    analytics/
```

---

## 题库 API（routes/api/question-bank）规划

> 说明：后端继续使用 `src/routes/api/**` + Prisma。

建议 API 目录：
```
src/routes/api/question-bank/
  questions/
    index.ts        # GET(list) POST(create) withAdminAuth
    $id.ts          # GET/PUT/DELETE withAdminAuth
  categories/
    index.ts        # GET(flat|tree) POST(create) withAdminAuth
    $id.ts          # GET/PUT/DELETE withAdminAuth
  tags/
    index.ts        # GET(list) POST(create) withAdminAuth
    $id.ts          # PUT/DELETE withAdminAuth
  practice/
    start.ts        # POST start session withAuth
    next.ts         # GET/POST next question withAuth
    submit.ts       # POST submit attempt withAuth
    history.ts      # GET history/stats withAuth
  analytics/
    overview.ts     # GET admin-only overview withAdminAuth
  import-export/
    import.ts       # POST import job withAdminAuth
    jobs.ts         # GET job list/status withAdminAuth
```

### categories 树 API 约定
- `GET /api/question-bank/categories`：平铺列表（表格/筛选更好用）
- `GET /api/question-bank/categories?tree=1`：树形结构（用于树形选择器/导航）
- 最小约束：
  - 禁止把节点的 parent 设置成自己
  - 可选增强：禁止设置成自己的子孙（防环）
  - 最省事的第一版：**不支持移动节点**（只允许创建时指定 parent，更新只改 name 等），后续再做移动与深度重算

---

## 实施里程碑（按“先壳后实”）

### Milestone 1：只落骨架（不动业务逻辑）
目标：让 `/question-bank/*` 路由可访问（需登录），模块目录与导出策略稳定。

- 新增：`src/modules/question-bank/**` 骨架（features 占位页面 + shared 壳）
- 新增：`src/routes/question-bank/*`（只装配到模块页面）
- 修改：`src/middleware.ts` 新增 `withAuth`（普通用户鉴权）
- 方案 Y：题库模块 client 放在 `modules/question-bank/shared/services/qb-api-client.ts`（不继续扩展 `src/lib/api-client.ts`）

验收：
- `/question-bank` 能打开
- `/question-bank/practice` 能打开（页面可先占位）
- 不引入任何题库 Prisma 表、不引入任何题库 API

### Milestone 2：categories（树）端到端
- Prisma：新增 Category 模型（parentId + depth）
- API：categories CRUD + tree endpoint
- 前端：categories 管理页（表格 + 树选择器）

### Milestone 3：questions + tags
- Prisma：Question、Tag、QuestionTag
- API：questions CRUD + tags CRUD + 关联编辑
- 前端：questions 管理页 + tags 管理页

### Milestone 4：practice（普通用户）
- Prisma：PracticeSession、PracticeAttempt
- API：start/next/submit/history
- 前端：练习页（题目展示 + 提交 + 复盘）

### Milestone 5：analytics + import-export
- analytics：先做 read-only 聚合 API（不落缓存表）
- import-export：先做 job 模式（导入任务 + 状态）

---

## 系统相关 features：是否能整合到一个模块？

### 现状盘点（当前系统后台域）
`src/features/admin/*` 包含：
- navigation 配置：`navgroup / navitem / navigation / rolenavgroup / userrolenavgroup`
- identity 管理：`users / session / verification / account`
- org 管理：`organization`
- i18n 管理：`translation`
- 审计/系统日志：`log`

对应路由：
- 前端：`src/routes/admin/*`
- API：`src/routes/api/admin/*`

### 结论
- **可以整合**，但不建议把“用户侧 identity”也一起塞进同一个 admin 模块。
- 推荐拆成两个模块：
  - `modules/system-admin`：管理后台（admin-only）
  - `modules/identity`：用户侧身份/会话（所有业务模块可复用）

原因：
- `practice` 等用户侧功能需要依赖“登录态/会话”，不应该反向依赖 admin UI。
- admin 域和 user 域生命周期、权限完全不同，强行合并会导致依赖污染。

---

## system-admin 模块建议结构

```
src/modules/system-admin/
  index.ts
  shared/
    hooks/
    services/
    types/
    utils/
  features/
    navigation/      # navgroup/navitem/role bindings
    identity/        # users/sessions/verification/account
    org/             # organization/member/invitation
    i18n/            # translation
    audit/           # system log + audit log
```

### 与现有 routes/admin 的关系
- `src/routes/admin/*` 保持为入口装配
- 逐个把 `routes/admin/*.tsx` 的组件 import 从 `~/features/admin/...` 改成 `~/modules/system-admin/...`

### 与现有 routes/api/admin 的关系
- 第一阶段不动 API 路径（避免破坏前端调用/权限/缓存）
- 代码迁移时允许把“可复用的纯函数/序列化/schema”搬到 `modules/system-admin/shared/*`

---

## identity 模块建议结构

```
src/modules/identity/
  index.ts
  shared/
    hooks/          # useSession/useAuth 等
    services/       # auth client 封装
    types/
    utils/
  features/
    profile/
    sessions/
```

说明：
- 现有 `src/features/auth`、`src/features/sessions`、`src/hooks/use-auth.ts` 等可以逐步迁移。

---

## 迁移策略（系统模块整合：先壳后搬）

### Phase 1：只建壳
- 新增 `modules/system-admin`、`modules/identity` 目录与空的 public exports
- 不改业务逻辑

### Phase 2：路由装配切换（低风险）
- 优先把 `routes/admin/*` 的页面组件 import 改到 `modules/system-admin`（页面组件内部仍然可以临时 re-export 旧 feature）

### Phase 3：搬迁 feature（逐个）
迁移优先级建议：
1) `translation`、`log`（相对独立）
2) `navgroup/navitem/navigation`（共享多，但边界清晰）
3) `organization/member/invitation`（链路较长）
4) `users/session/account/verification`（鉴权/审计影响面最大）

每次迁移只做：
- 移动文件 + 更新 import
- 保持 API 兼容

---

## 约束与注意事项
- 避免把所有东西都扔进 `src/shared`（会退化成“全局大杂烩”）
- 模块内共享优先放 `modules/<module>/shared`
- `src/lib/api-client.ts` 当前强耦合 `features/*/schema`：
  - 新模块一律使用模块内 client（方案 Y）
  - 旧功能后续再渐进拆分
