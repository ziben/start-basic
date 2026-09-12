# Admin 子域拆分评估

## 1. 结论

`src/modules/admin` 已经具备按子域拆分的目录基础，但当前还不适合一次性做大规模迁移。下一步应采用“先诊断、再切单域、最后收口共享层”的方式推进。

推荐第一批拆分候选：

1. `payment`：边界清晰，已经有独立业务模块 `src/modules/payment` 可对齐。
2. `system-config`：已经和 `src/infrastructure/config` 建立读取侧边界，适合继续收口管理端写入与刷新事件。
3. `audit`：审计日志天然是横切能力，适合从 admin 页面域中抽出更稳定的服务边界。

暂不建议先拆：

- `organization`、`navigation`、`rbac`、`identity`：体量更大，页面、权限、组织、导航之间耦合更多，应在小域验证模式后再拆。

## 2. 当前体量

按 `src/modules/admin/features/*` 粗略统计：

| 子域          | 文件数 | 备注                                       |
| ------------- | -----: | ------------------------------------------ |
| organization  |     56 | 组织、成员、部门、邀请混合，耦合较多       |
| navigation    |     42 | navgroup、navitem、角色导航、用户导航混合  |
| rbac          |     40 | 系统角色、组织角色、权限资源和 action 混合 |
| identity      |     36 | 用户、会话、账号、验证混合                 |
| system-config |     20 | 配置 CRUD、历史、刷新链路较完整            |
| i18n          |     17 | 翻译管理，相对独立                         |
| audit         |     13 | 日志查询和展示，边界较清晰                 |
| payment       |     13 | 支付订单后台管理，边界清晰                 |
| ai-chat       |      7 | 单页能力，暂不急于拆                       |

按职责粗略统计：

| 类型                     | 文件数 |
| ------------------------ | -----: |
| components               |    119 |
| other/page/context/index |     63 |
| hooks                    |     33 |
| server-fns               |     18 |
| services                 |     18 |
| data                     |     10 |
| types                    |      7 |

## 3. 拆分原则

### 3.1 不移动 TanStack Start 路由入口

`src/routes/_authenticated/admin/*` 继续作为框架路由入口。拆分只移动模块内部能力边界，不把路由动态化。

推荐模式：

```text
src/routes/_authenticated/admin/payment/orders.tsx
  -> import admin/payment page 或 payment admin adapter
```

### 3.2 不把 admin 拆成一个运行时插件平台

admin 子域拆分的目标是降低维护成本，而不是引入运行时启停、自动扫描或 DI 容器。

### 3.3 先拆稳定 service，再拆页面

每个子域优先识别稳定 service/server-fn/hook，再决定页面是否迁移。不要为了目录整齐先搬组件。

### 3.4 保留 shared admin primitives

以下内容暂时留在 `src/modules/admin/shared`：

- 表格基础组件
- admin 权限检查
- sidebar 数据读取
- 通用 selector
- admin 日志写入基础设施

只有当某个 shared 能力被单一子域独占时，再考虑下沉。

## 4. 推荐拆分顺序

### Phase A：模块诊断与 contract 固化

状态：已完成。

- 后台新增模块诊断页，用于查看 `moduleRegistry` 当前模块、依赖、exports 和 Better Auth plugin IDs。
- `auth`、`payment`、`health` 已有 module contract 测试。

### Phase B：Payment Admin Adapter

状态：已完成。

目标：把后台 payment 管理页面和 `src/modules/payment` 的稳定服务关系写清楚。

已落地改动：

- `src/modules/payment/admin` 承载后台支付订单页面、hooks、data、server-fns、formatter 与 admin service。
- `src/modules/admin/features/payment/index.ts` 仅保留 compatibility re-export。
- 后台支付路由直接挂载 `~/modules/payment/admin` 的 `PaymentOrdersPage`。
- 支付核心 service 与支付 API 路由未迁移，仍留在 `payment/shared` 与 TanStack route 入口。

验收：

- `src/modules/admin/features/payment` 只剩兼容入口。
- 后台支付订单页面测试或边界测试仍通过。
- `paymentModule.exports.services` 不因为后台页面需求膨胀。

### Phase C：System Config Event Boundary

状态：已完成最小事件接入。

- `config.runtime.updated` 作为配置刷新成功后的事实事件。
- 事件由 runtime config 管理端刷新链路发出。
- 事件 payload 不携带配置明文，只携带刷新时间、操作者和启用配置数量。

后续只有出现真实订阅方时，再补 handler 目录约定。

### Phase D：Audit Boundary

状态：已完成。

目标：让审计日志成为稳定横切能力。

已落地改动：

- `src/modules/audit/shared` 承载日志 schema、查询 hook、server-fn、查询 service 与写日志 service。
- `src/modules/audit/admin` 承载后台日志页面、表格、provider、筛选工具和页面级查询 hook。
- `src/modules/admin/features/audit/index.ts` 仅保留 compatibility re-export。
- 后台日志路由直接挂载 `~/modules/audit/admin` 的 `AdminLog`。
- `auditModule.exports.services` 只暴露稳定的 `LogService`、`writeAuditLog`、`writeSystemLog`，不把 UI 页面或 hooks 放入 registry。

验收：

- `src/modules/admin/features/audit` 只剩兼容入口。
- 后台日志页面仍通过边界测试和类型检查。
- 不把所有 admin 操作都改成 Event Bus。

### Phase E：大域拆分评估

在完成 payment/system-config/audit 三个小域后，再评估：

- `identity`
- `organization`
- `rbac`
- `navigation`

这些域再拆时应先写单独 plan，不应混在同一轮实施里。

## 5. 风险

- `organization`、`rbac`、`navigation` 存在权限与菜单数据交叉，过早迁移容易引入回归。
- 后台页面大量依赖通用 DataTable 和 Provider，直接搬目录容易造成 import churn。
- 如果把 registry 当成 service locator，会让调用链变得更难追踪。
- Event Bus 只适合事实通知，不适合替代 admin service 的同步流程。

## 6. 下一步建议

下一轮可从 Phase B 开始，只处理 `src/modules/admin/features/payment` 的后台 payment adapter 和测试，不扩大到其他 admin 子域。
