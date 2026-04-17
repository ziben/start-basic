# Start-Basic 栈内收口式架构重构设计

## 1. 背景与目标

`start-basic` 当前已经具备较清晰的业务模块化意识，核心技术栈稳定在：

- TanStack Start + TanStack Router
- React 19 + TanStack Query
- Better Auth
- Prisma
- Bun 自定义生产服务器

当前问题不在于“缺少架构”，而在于项目在持续演化后出现了多条基础设施链路并存、传输边界重复实现、以及 `admin` 域持续膨胀的问题。这些问题会让后续新增功能的成本逐步上升，并放大环境漂移、维护负担和回归风险。

本次设计的目标不是推翻当前技术栈，也不是引入一套更重的分层模型，而是在现有栈内做“收口”：

1. 保留 TanStack Start 的原生组织方式
2. 统一数据访问与环境配置主链路
3. 统一 HTTP Route / Server Function / Service 的职责分工
4. 将 `admin` 从超级模块拆为若干清晰子域
5. 将运行时、配置、认证、支付等基础设施显式收敛为独立边界

## 2. 非目标

本次设计明确不做以下事情：

- 不将项目拆成多仓或微服务
- 不将全部 Server Function 改成 REST API
- 不引入沉重的 repository / entity / factory 分层模板
- 不为了目录整洁大规模重写页面组件
- 不在第一阶段重构 UI 视觉或交互

## 3. 现状问题

### 3.1 数据层存在并行链路

当前项目同时存在以下数据链路痕迹：

- Prisma + PostgreSQL 适配器
- Drizzle + LibSQL / PGLite
- `db/prisma/migrations`
- `db/prisma/migrations_pg`
- `db/drizzle/*`

这意味着“主数据库链路”在工程层面并不单一。继续维持这种状态会造成：

- 本地、测试、生产环境数据库行为不一致
- schema 变更来源不明确
- ORM 能力与迁移策略难以建立统一规则

### 3.2 数据库配置存在危险默认值

当前数据库 URL 逻辑存在硬编码 PostgreSQL fallback。若环境变量缺失，应用可能连接到非预期数据库，这属于高风险设计，不应继续保留。

### 3.3 传输层与业务层职责重叠

当前部分用例同时存在：

- `routes/api/*` 中的 HTTP 路由逻辑
- `modules/*/server-fns/*` 中的 Server Function 逻辑
- `services/*` 中的业务逻辑

典型问题是输入校验、鉴权、错误处理和业务编排被重复写在多层中，导致：

- 同一用例有多份实现
- transport 入口改动容易漏改
- 逻辑测试难以聚焦在一份核心用例上

### 3.4 `admin` 模块已演化为超级模块

当前 `src/modules/admin` 承载了 identity、organization、rbac、navigation、audit、i18n、payment、system-config 等多个子域。这种继续横向堆叠的方式会让：

- 新功能默认落到 `admin/features/*`
- 共享逻辑边界越来越模糊
- 页面、hooks、server-fns、service 的依赖关系变得难以推断

### 3.5 运行时基础设施与业务代码耦合增长

根目录 `server.ts` 已承载较多运行时职责，包括静态资源预加载、压缩、缓存控制、性能日志等。随着部署和运维逻辑增长，如果不收口成明确的 infrastructure boundary，业务仓库会持续吸收运行时复杂度。

### 3.6 文档与真实结构开始漂移

现有 `docs/ARCHITECTURE.md` 仍然描述的是一个偏理想化的通用结构，而真实代码已经出现更细化的历史演化结果。架构文档与真实代码脱节后，会降低团队对“标准结构”的共识。

## 4. 设计原则

### 4.1 栈优先，而不是抽象优先

本项目的架构演进必须尊重现有技术栈能力：

- TanStack Start 的文件路由继续作为页面与 HTTP 入口
- TanStack Query 继续作为前端 server state 编排层
- Server Function 继续作为同源前后端动作入口
- Prisma 继续作为主 ORM
- Better Auth 继续作为认证核心

任何重构都不应违背这些基础能力。

### 4.2 一个用例只有一份核心实现

同一业务动作只能有一份核心业务编排逻辑。不同 transport 层只能做“适配”，不能各自承载主逻辑。

### 4.3 基础设施显式化

数据库、认证、支付、日志、配置、运行时服务器都属于 infrastructure，不应长期混放在 `shared/lib` 这类模糊目录中。

### 4.4 先收边界，再拆结构

第一阶段优先统一主链路与职责分工，而不是先移动大量文件。只有边界清楚后，再做目录结构调整才不会返工。

### 4.5 保持渐进迁移

整个方案采用“边迁移边可运行”的方式推进，避免大爆炸式重构。

## 5. 目标架构

目标架构仍然保持 TanStack Start 友好的组织方式，但将“业务模块”和“基础设施边界”分开。

```text
src/
├── routes/                        # TanStack Start 文件路由
│   ├── api/                       # 对外 HTTP 接口 / webhook / callback
│   ├── _authenticated/            # 认证页面路由
│   └── (public)/(auth)            # 公共页面路由
├── modules/                       # 业务模块
│   ├── auth/
│   ├── payment/
│   ├── ai/
│   ├── settings/
│   └── admin/
│       ├── identity/
│       ├── organization/
│       ├── access-control/
│       ├── navigation/
│       ├── ops/
│       └── billing/
├── infrastructure/                # 基础设施边界
│   ├── db/
│   ├── auth/
│   ├── payment/
│   ├── config/
│   ├── logging/
│   └── runtime/
├── shared/                        # 真正全局共享且与业务弱耦合的通用资源
│   ├── ui/
│   ├── hooks/
│   ├── query/
│   ├── schemas/
│   ├── utils/
│   └── types/
└── generated/                     # 生成代码
```

说明：

- `routes/` 继续保留，不引入额外 controller 层
- `modules/` 继续作为核心业务落点
- `infrastructure/` 新增为显式边界
- `shared/` 缩减为真正通用的共享内容，不再承载所有底层能力

## 6. 分层职责定义

### 6.1 `routes/*`

`routes` 只负责 transport 适配：

- URL / 文件路由约定
- request / query / body 解析
- headers / cookies / session 注入
- 输入校验
- 响应状态码与 JSON / HTML 映射

`routes` 不负责：

- 具体业务编排
- 持久化细节
- 多步骤业务副作用 orchestrate

### 6.2 `modules/*/server-fns/*`

`server-fns` 继续保留，但职责限定为同源前后端调用入口：

- 供页面、hooks、TanStack Query 使用
- 与路由不同，它不承载对外 HTTP contract
- 可以负责当前请求上下文到业务输入的转换

`server-fns` 不应成为第二套业务实现。

### 6.3 `modules/*/services/*`

`services` 是业务用例的核心实现层：

- 编排领域规则与跨依赖调用
- 组织数据库读写、第三方服务调用、日志记录
- 返回稳定的业务结果对象

每个关键用例只允许存在一份核心 service。

### 6.4 `infrastructure/*`

`infrastructure` 负责具体技术实现：

- Prisma client
- Better Auth 初始化与插件
- WeChat Pay client
- Runtime config provider
- Logging writer
- Custom Bun server

业务层可依赖 infrastructure 暴露的稳定接口，但不应关心实现细节。

## 7. 栈内推荐的职责边界

### 7.1 Prisma 是唯一主数据链路

确定 Prisma + PostgreSQL 为唯一主数据访问主线。Drizzle / PGLite 若保留，只能是明确标注的实验或测试辅助手段，不能继续与主链路并列。

配套规则：

- 只有一套主 schema 来源
- 只有一套主 migration 流程
- 只有一套生产数据库连接策略

### 7.2 Better Auth 收敛为 infrastructure/auth

Better Auth 当前已经与请求上下文、动态权限和插件系统深度绑定，适合作为 infrastructure/auth 的核心组成，而不是继续散落在模块与 shared 之间。

建议将以下能力逐步收口：

- auth init
- auth dynamic access control
- auth plugin wiring
- trusted origins / runtime auth config

### 7.3 TanStack Query 继续作为页面层数据编排中心

不建议用新 abstraction 替换 TanStack Query。应继续使用现有模式，但做两件事：

- query key 继续集中管理
- query hook 不直接写持久化与第三方调用，只调用 server-fn / route 层

### 7.4 Server Function 与 HTTP Route 的边界

应明确分工：

- `routes/api/*` 只用于 webhook、payment callback、第三方调用、明确的 HTTP API
- `server-fns/*` 用于站内页面调用

如果一个用例同时被 HTTP API 和 Server Function 使用，两者都调用同一份 service。

### 7.5 Bun 自定义服务器收敛为 runtime 模块

如果自定义 `server.ts` 的静态资源优化、缓存、ETag、gzip、日志能力是部署所需，则应明确把它视作 `runtime` 子系统，而不是继续以“根目录脚本”方式自然膨胀。

## 8. Admin 域拆分方案

`admin` 不建议拆成新仓，但应拆成子域边界明确的业务模块簇。

推荐拆分为：

- `admin/identity`
  - users
  - sessions
  - accounts
  - verification
- `admin/organization`
  - organizations
  - members
  - invitations
  - departments
- `admin/access-control`
  - roles
  - org-roles
  - permissions
  - role-permission
- `admin/navigation`
  - navgroup
  - navitem
  - role-navgroup
  - user-role-navgroup
- `admin/ops`
  - audit log
  - translation
  - system-config
  - ai-chat
- `admin/billing`
  - payment orders

该拆分在第一阶段不要求改 URL，只要求：

- 共享逻辑归位
- 文件依赖边界更清晰
- 新功能不再默认挂到 `admin/features/*` 顶层

## 9. 迁移策略

### Phase 0: 主线确认

目标：在不改业务行为的前提下，确认唯一主链路。

输出：

- Prisma + PostgreSQL 为唯一主链路的明确结论
- Drizzle / PGLite 的去留策略
- 数据库环境变量来源统一

### Phase 1: 基础设施收口

目标：先把最容易引发系统性混乱的底层能力收口。

优先收口对象：

- 数据库 client
- 数据库 URL 解析
- runtime config
- auth init
- WeChat Pay client

这一阶段主要是移动边界与统一入口，不改变外部业务 contract。

### Phase 2: 用例层统一

目标：让 route / server-fn 不再重复写业务逻辑。

首选试点域：

- payment
- auth session
- system-config

原因：

- 这些域跨 transport 边界明显
- 有认证 / 配置 / 第三方依赖
- 最能暴露边界设计是否合理

### Phase 3: Admin 子域拆分

目标：把超级模块拆为可持续扩展的子域结构。

这一阶段应遵守：

- 优先拆共享逻辑和依赖边界
- 不先追求大规模重命名
- 路由文件路径可暂时保持兼容

### Phase 4: Runtime 收口

目标：把 Bun 自定义 server 从“脚本”收敛成明确 runtime 模块。

需要回答：

- 哪些能力是必须保留的
- 哪些能力可以回归框架默认
- 部署说明与实现是否一致

### Phase 5: 文档与约束补齐

目标：防止重构后再次滑回混乱状态。

补齐内容：

- 更新架构文档
- 增加 import boundary 规则
- 增加关键域测试
- 明确模块开发约定

## 10. 第一阶段建议优先处理的文件

以下文件适合作为第一阶段的直接落点：

- `src/shared/lib/database-url.ts`
- `src/shared/lib/db.ts`
- `src/shared/lib/drizzle.ts`
- `src/shared/config/runtime-config.ts`
- `src/modules/auth/shared/lib/auth.ts`
- `src/modules/payment/shared/server-fns/prepay.ts`
- `src/routes/api/v1/payment/wechat/prepay.ts`
- `server.ts`

原则：

- 先收底层边界
- 再统一用例实现
- 最后再大范围梳理目录结构

## 11. 风险与应对

### 风险 1：重构期间业务入口重复维护

应对：

- 先抽共享 service，再让 route / server-fn 双向复用
- 不在同一阶段同时修改多个 transport contract

### 风险 2：目录迁移引发大面积 import churn

应对：

- 第一阶段先建立新边界，不强制大规模 rename
- 用 barrel file 或过渡 re-export 控制迁移节奏

### 风险 3：数据链路调整影响环境稳定性

应对：

- 先锁定主 schema、主迁移命令、主连接串策略
- 去掉危险默认值
- 用定向 smoke test 覆盖登录、配置读取、支付预下单

### 风险 4：架构文档再次落后于实现

应对：

- 每个阶段结束时更新文档
- 将目录约束与职责约束写成项目级规则

## 12. 验收标准

当本轮架构优化完成后，应满足以下标准：

1. 生产数据库连接只存在一条明确主链路
2. 同一核心业务动作只有一份业务编排实现
3. `routes/api` 与 `server-fns` 的职责边界清晰且一致
4. `admin` 已完成子域拆分或至少完成边界清理
5. `server.ts` 对应的 runtime 责任有明确归属
6. 架构文档能真实描述当前代码组织方式

## 13. 推荐执行策略

推荐采用“先收口、再试点、后推广”的顺序：

1. 先完成数据与基础设施收口
2. 以 payment 作为 transport / service 统一试点
3. 再拆 admin 子域
4. 最后处理 runtime 与文档收尾

这是当前仓库在不脱离现有技术栈前提下，收益最高、风险最低的重构路线。
