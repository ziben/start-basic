# Start-Basic 可插拔模块框架阶段设计

## 1. 背景

`start-basic` 已经采用 TanStack Start、React 19、TanStack Query、Better Auth、Prisma 和模块化业务目录。项目当前的问题不是缺少功能模块，而是模块边界还主要依赖目录约定和人工共识：

- `src/routes/` 由 TanStack Start 文件路由驱动，不能被运行时插件系统接管。
- Better Auth 已经有成熟插件机制，认证扩展不应被项目自研插件系统替代。
- `src/modules/*` 已经具备功能分组，但还缺少统一的模块描述、注册入口和跨模块通信约定。
- `admin`、`auth`、`payment` 等模块会继续增长，如果没有轻量模块契约，后续扩展容易退回直接互相 import 内部实现。

本设计的目标是在尊重 TanStack Start 与 Better Auth 原生机制的前提下，新增一个轻量、显式、可渐进演进的模块层。

## 2. 设计目标

当前设计先建立一个可长期演进的轻量模块协调层：

1. 明确“一个业务模块如何声明自己”。
2. 提供显式模块注册入口，避免运行时自动扫描和隐式加载。
3. 提供 typed Event Bus，承载跨模块副作用通知。
4. 以 `auth` 作为第一个模块示例，暴露认证运行时入口与 Better Auth 插件元信息。
5. 将 `payment`、`health` 这类真实业务模块逐步接入模块注册入口。
6. 保持现有路由、认证初始化、Server Functions 和业务服务行为不变。

## 3. 非目标

本设计明确不做：

- 不做运行时动态插件加载。
- 不做自动发现 `src/modules/*/module.ts`。
- 不做模块启停、热插拔或远程插件市场。
- 不接管 TanStack Start 文件路由。
- 不替换 Better Auth 的 server/client plugin 组装方式。
- 不大规模迁移所有模块。
- 不把尚未稳定的内部函数包装成虚假的 service contract。
- 不把模块 registry 做成通用 DI 容器。
- 不用 Event Bus 承担同步查询或核心事务编排。

这些能力不是永远不能做，而是不适合作为当前基础设施。当前最重要的是先把模块边界、注册入口、公开 contract 与通信方式稳定下来。

## 4. 栈内边界原则

### 4.1 TanStack Start 继续负责路由与 SSR

TanStack Start 的文件路由、SSR、Server Functions 都是编译期和框架约定驱动的能力。模块系统不能试图在运行时动态注册路由，也不应该隐藏页面入口。

推荐模式是：

```text
routes/* 作为框架入口
  -> import modules/* 的 page / server-fn / service
  -> module registry 只描述模块能力，不接管路由生成
```

也就是说，模块系统提供“模块元信息和协作协议”，不是新的 router。

### 4.2 Better Auth 继续负责认证插件

Better Auth 已经有成熟 plugin 能力，包括 server plugin、client plugin、hook、endpoint、schema、权限扩展等。项目的模块系统不应复制 Better Auth 的插件系统。

第一阶段 `authModule` 只暴露：

- 当前 auth runtime：`auth`、`getAuth`
- Better Auth server plugin IDs：例如 `bearer`、`username`、`organization`、`admin`、`wechat-oauth`
- Better Auth client plugin IDs：例如 `username`、`admin`、`organization`、`wechat-oauth`

它不重新组装 `auth-init.ts` 中依赖运行时数据的 Better Auth server plugins，避免出现第二套认证配置源。

### 4.3 模块系统只做协调层

模块系统的职责是：

- 定义模块契约。
- 显式注册模块。
- 聚合模块元信息。
- 提供跨模块事件通信基础设施。

模块系统不负责：

- 数据库访问。
- 页面路由。
- 权限决策本身。
- 业务服务编排。
- 第三方 SDK 初始化细节。

## 5. 当前落地结构

当前已经形成以下基础文件：

```text
src/
├── core/
│   ├── event-bus.ts
│   └── module-registry.ts
└── modules/
    ├── auth/
    │   └── module.ts
    ├── health/
    │   └── module.ts
    ├── payment/
    │   └── module.ts
    ├── events.ts
    └── index.ts
```

### 5.1 `src/core/event-bus.ts`

`event-bus.ts` 提供一个纯 TypeScript、无外部依赖、进程内的 typed pub/sub：

- `EventMap`
- `EventHandler<TPayload>`
- `Unsubscribe`
- `EventBus<TEvents>`
- `createEventBus<TEvents>()`

当前能力包括：

- `emit(type, payload)`：异步触发某类事件。
- `on(type, handler)`：订阅事件并返回取消订阅函数。
- `once(type, handler)`：只监听一次。
- `clear(type?)`：清理某类事件或全部事件。

事件类型不放在 `core`，由应用或模块按需声明。例如：

```ts
interface AppEvents {
  'auth.user.created': {
    userId: string
    email: string
  }
  'payment.order.paid': {
    orderId: string
    userId: string
  }
}
```

这样 `core` 保持通用，业务事件由业务边界定义。

### 5.2 `src/core/module-registry.ts`

`module-registry.ts` 定义模块契约与显式注册器：

- `BetterAuthModuleConfig`
- `AppModule`
- `ModuleRegistry<TModules>`
- `defineModule()`
- `createModuleRegistry()`

第一阶段支持的模块元信息包括：

- `key`：模块唯一标识。
- `version`：模块版本。
- `dependencies`：模块依赖声明。
- `betterAuth`：Better Auth server/client plugin 或 plugin ID 元信息。
- `exports`：模块显式公开能力。

注册器保证：

- 模块由代码显式传入。
- 注册顺序可控。
- 重复 `key` 会立即抛错。
- 可按 `key` 获取模块。
- 可聚合 Better Auth plugin 或 plugin ID。

### 5.3 `src/modules/auth/module.ts`

`authModule` 是第一阶段示例模块。它声明：

- `key: 'auth'`
- `version: '1.0.0'`
- Better Auth server plugin IDs
- Better Auth client plugin IDs
- `exports.runtime.auth`
- `exports.runtime.getAuth`

它刻意不做以下事情：

- 不注册假的 `AuthService`。
- 不导出尚未稳定的 `sessionApi`。
- 不把 `authClient` 或 `useAuth` 注册成服务容器能力。
- 不重新创建 Better Auth server plugin 数组。

原因是当前真正稳定的服务端认证入口是 `auth` 和 `getAuth`，而 Better Auth server plugin 组装依赖数据库动态权限与环境变量，应继续留在现有初始化链路。

### 5.4 `src/modules/index.ts`

`src/modules/index.ts` 是应用级显式模块注册入口：

```ts
export const moduleRegistry = createModuleRegistry([authModule, paymentModule, healthModule] as const)
```

后续新增模块时，应优先在这里显式注册，而不是引入自动扫描。

### 5.5 `src/modules/payment/module.ts`

`paymentModule` 是第一个真实业务依赖模块。它声明：

- `key: 'payment'`
- `version: '1.0.0'`
- `dependencies: ['auth']`
- `exports.services.createPrepayOrder`
- `exports.services.queryPaymentOrderStatus`
- `exports.services.syncPaymentOrderStatus`
- `exports.services.closePaymentOrder`
- `exports.events.orderPaid`
- `exports.events.orderClosed`
- `exports.events.orderFailed`

它的设计边界是“暴露稳定支付能力和事件名”，不重写支付路由，不移动所有 payment 文件，也不引入覆盖现有 service 的新抽象层。

### 5.6 `src/modules/health/module.ts`

`healthModule` 是第二个真实业务模块。它声明：

- `key: 'health'`
- `version: '1.0.0'`
- `dependencies: ['auth']`
- `exports.services.HealthReportService`

`health` 当前没有跨模块事实事件，因此不需要为了形式完整而声明空事件表。后续只有当体检报告创建、解析完成、指标异常等事实需要被其他模块消费时，再加入 `AppEvents` 和模块 `exports.events`。

### 5.7 `src/modules/events.ts`

`src/modules/events.ts` 是应用级事件聚合入口，当前提供：

- `AppEvents`
- `AppEventBus`
- `createAppEventBus()`
- `appEventBus`

事件类型放在 `modules` 层，而不是 `core`。`core/event-bus.ts` 只提供通用 typed pub/sub 能力，不知道任何业务事件名。

## 6. 模块间通信推荐方式

模块间通信不应该只有一种方式。不同关系应使用不同机制。

### 6.1 直接 import：用于稳定基础设施

适用场景：

- `auth`
- `db`
- 通用 `utils`
- UI primitives

这些能力是基础设施或稳定公共能力，直接 import 成本最低，也最清晰。

### 6.2 显式 service contract：用于同步业务能力

适用场景：一个模块需要调用另一个模块的稳定业务能力，例如 payment 需要查询用户、组织或权限信息。

原则：

- 只暴露稳定 contract。
- 不把内部实现细节变成公共 API。
- 不为了“看起来模块化”而注册不存在的 service。
- 只有存在明确消费方或近期集成点时，才新增 `exports.services`。
- service contract 应优先引用已有 service，而不是在 `module.ts` 中重新包一层。
- UI hook、页面组件和 TanStack Query hook 默认不作为 service contract 暴露。

### 6.3 Typed Event Bus：用于跨模块副作用

适用场景：

- 用户创建后触发欢迎消息、审计、初始化设置。
- 支付成功后触发订单状态、通知、权益开通。
- 系统配置更新后通知缓存刷新。

事件适合表达“已经发生的事实”，不适合表达“必须立即返回结果的查询”。

事件命名规则：

```text
<module>.<domain>.<past-tense-action>
```

示例：

- `auth.user.created`
- `payment.order.paid`
- `payment.order.closed`
- `payment.order.failed`
- `config.runtime.updated`

新增事件时必须同时明确：

- 事件事实由哪个模块拥有。
- payload 是否只包含稳定字段。
- 事件是否允许没有订阅方。
- 失败是否影响原业务流程。

### 6.4 TanStack Query invalidation：用于 UI server-state 同步

前端数据刷新仍然应优先使用 TanStack Query 的 query key 和 invalidation。不要用 Event Bus 替代 TanStack Query 的缓存一致性机制。

### 6.5 Server Functions：用于同源前后端动作入口

Server Functions 仍是页面、hooks、TanStack Query 到服务端业务逻辑的主要入口。模块系统不替代 Server Functions，只帮助业务能力边界更清晰。

### 6.6 Module Registry：用于能力发现，不用于业务编排

`moduleRegistry` 的职责是声明和读取模块元信息。它不应该成为核心业务调用路径上的 service locator。

推荐用法：

- 测试模块是否显式注册。
- 聚合 Better Auth plugin IDs。
- 在管理页或诊断页展示已启用模块能力。
- 作为架构边界的静态索引。

不推荐用法：

- 在业务 service 内通过 registry 动态查找另一个 service。
- 用 registry 控制运行时启停模块。
- 把 registry 当成依赖注入容器。

## 7. 阶段状态与演进路径

### Phase 1：基础骨架（已完成）

已完成内容：

- 新增 `core/event-bus.ts`。
- 新增 `core/module-registry.ts`。
- 新增 `modules/auth/module.ts`。
- 新增 `modules/index.ts`。
- 保持现有行为不变。

验收标准：

- TypeScript 类型检查通过。
- 现有 auth 行为不变。
- 模块注册入口可以读取 `authModule`。
- 没有引入运行时自动扫描或第二套 auth 初始化。

### Phase 2：支付模块接入（已完成）

当前已完成 `payment` 模块接入。`payment` 和 `auth` 有真实依赖关系，已用于验证模块边界的最小可用价值。

已落地内容：

- 新增 `src/modules/payment/module.ts`。
- 声明 `payment` 的 `key`、`version`、`dependencies: ['auth']`。
- 只暴露稳定的 payment service 与事件名。
- `src/modules/index.ts` 显式注册 `[authModule, paymentModule, healthModule]`。
- 支付成功、关闭、失败等事实已声明为 typed events。

不要做：

- 不重写支付路由。
- 不移动所有 payment 文件。
- 不引入新的支付抽象层覆盖现有 service。

### Phase 3：模块事件规范（已完成最小骨架）

当前已建立应用级事件聚合入口 `src/modules/events.ts`，统一事件命名继续采用：

```text
<module>.<domain>.<past-tense-action>
auth.user.created
payment.order.paid
config.runtime.updated
```

`AppEvents`、`AppEventBus`、`createAppEventBus()` 和 `appEventBus` 放在 `src/modules/events.ts`。这个位置属于应用层，符合 `core` 不依赖业务事件的边界原则。

### Phase 4：服务契约收敛（设计完成，按需实施）

当前不引入通用 DI 容器，也不把 registry 放进业务调用链。服务契约收敛采用“模块声明 + 直接 import 稳定 service”的轻量方式。

服务命名方式：

- `exports.services` 下使用真实 service 名称。
- 函数 service 使用动词开头，例如 `createPrepayOrder`。
- 类 service 保留类名，例如 `HealthReportService`。
- 不新增 `PaymentService`、`HealthService` 这类空泛聚合名，除非真实存在对应边界。

服务注册方式：

- `module.ts` 只引用模块内部已经稳定的 service。
- `src/modules/index.ts` 显式注册模块。
- 消费方仍直接 import 具体 service；registry 只描述能力，不替代 import。

服务测试方式：

- 每个暴露 service 的模块都应有 `module.test.ts` 锁定 `key`、`dependencies` 和 `exports`。
- registry 测试锁定显式模块顺序和依赖声明。
- 业务 service 自己的行为测试继续放在模块内部，不迁入 registry 测试。

不要过早做通用 DI 容器。当前项目更需要边界清晰，而不是容器复杂度。

### Phase 5：后续扩展候选

后续只有出现真实需求时再推进以下方向：

1. `admin` 子域拆分：当 admin 内部模块继续膨胀时，把高内聚子域拆成独立 `module.ts`。
2. `config` 事件：当运行时配置更新需要通知其他模块刷新缓存时，增加 `config.runtime.updated`。
3. 模块诊断页：如果需要在后台展示启用模块、依赖和公开能力，可读取 `moduleRegistry.modules`。
4. 事件订阅约定：当出现 2 个以上事件订阅方时，再补充事件 handler 目录约定和测试模式。

## 8. 风险与约束

### 8.1 最大风险：过度设计

如果第一阶段就做自动发现、动态加载、生命周期、依赖注入容器，会很快和 TanStack Start 的编译期模型冲突，也会增加维护成本。

控制方式：

- 坚持显式注册。
- 坚持 compile-time first。
- 坚持每次只迁移一个模块。

### 8.2 Better Auth 双配置风险

`auth-init.ts` 当前依赖动态权限和环境变量，不能在 `authModule` 中重新静态组装 server plugins。

控制方式：

- `authModule` 第一阶段只记录 plugin IDs 和 runtime exports。
- 真正的 Better Auth 初始化仍在现有链路。

### 8.3 Event Bus 滥用风险

Event Bus 如果被用来做同步查询或核心业务编排，会让调用链变得不可追踪。

控制方式：

- Event Bus 只表达事实事件。
- 需要返回结果的调用使用 service contract。
- UI 数据刷新继续使用 TanStack Query。

### 8.4 公共 exports 膨胀风险

如果模块把所有内部函数都放进 `exports`，模块边界会失效。

控制方式：

- 只导出外部确实需要的稳定能力。
- 对未使用、未稳定的内部 API 继续保持私有。
- 每次新增 exports 都要能说明消费方是谁。

## 9. 模块接入检查清单

新增模块 `module.ts` 时，应检查：

- [ ] 模块是否有稳定 `key`。
- [ ] 是否需要 `version`。
- [ ] 是否声明真实依赖，而不是隐式 import 内部文件。
- [ ] 是否只暴露稳定 exports。
- [ ] 是否避免导出 UI hook 作为服务。
- [ ] 是否避免创建没有消费方的 fake service。
- [ ] 是否有跨模块副作用事件。
- [ ] 是否仍尊重 TanStack Start 路由入口。
- [ ] 是否没有复制 Better Auth 或第三方 SDK 的初始化逻辑。
- [ ] 是否有 `module.test.ts` 锁定模块 contract。
- [ ] 是否需要更新 `src/modules/index.ts` 和 registry 测试。
- [ ] 如果新增事件，是否同步更新 `src/modules/events.ts` 和事件测试。

## 10. 验收标准

该模块框架设计视为完成时，需要满足：

- `core` 只包含通用 registry 与 event bus，不依赖业务模块。
- 所有已接入模块都通过 `src/modules/index.ts` 显式注册。
- `auth`、`payment`、`health` 的模块 contract 有测试覆盖。
- 应用级事件类型聚合在 `src/modules/events.ts`。
- 设计文档准确反映当前已落地结构、非目标和后续扩展边界。
- 定向模块测试通过：

```powershell
pnpm vitest run src/modules/events.test.ts src/modules/index.test.ts src/modules/auth/module.test.ts src/modules/payment/module.test.ts src/modules/health/module.test.ts
```

## 11. 当前结论

这个方案可行，但前提是保持克制：它不是完整运行时插件平台，而是一个编译期显式的模块协调层。

当前最合理的方向是：

1. 保留 TanStack Start 作为路由和 SSR 框架。
2. 保留 Better Auth 作为认证插件系统。
3. 用 `moduleRegistry` 明确模块清单和能力边界。
4. 用 typed Event Bus 处理跨模块副作用。
5. 对真实业务模块采用“显式声明、最小 exports、定向测试”的接入方式。
6. 后续只在出现真实消费方时扩展 service contract 或事件订阅约定。

这能让项目走向“多模块、可插拔”的基础开发框架，同时避免一开始就引入过重、与现有栈冲突的动态插件系统。
