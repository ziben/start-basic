# Start-Basic 可插拔模块框架阶段设计

## 1. 背景

`start-basic` 已经采用 TanStack Start、React 19、TanStack Query、Better Auth、Prisma 和模块化业务目录。项目当前的问题不是缺少功能模块，而是模块边界还主要依赖目录约定和人工共识：

- `src/routes/` 由 TanStack Start 文件路由驱动，不能被运行时插件系统接管。
- Better Auth 已经有成熟插件机制，认证扩展不应被项目自研插件系统替代。
- `src/modules/*` 已经具备功能分组，但还缺少统一的模块描述、注册入口和跨模块通信约定。
- `admin`、`auth`、`payment` 等模块会继续增长，如果没有轻量模块契约，后续扩展容易退回直接互相 import 内部实现。

本设计的目标是在尊重 TanStack Start 与 Better Auth 原生机制的前提下，新增一个轻量、显式、可渐进演进的模块层。

## 2. 设计目标

第一阶段只建立基础骨架：

1. 明确“一个业务模块如何声明自己”。
2. 提供显式模块注册入口，避免运行时自动扫描和隐式加载。
3. 提供 typed Event Bus，承载跨模块副作用通知。
4. 以 `auth` 作为第一个模块示例，暴露认证运行时入口与 Better Auth 插件元信息。
5. 保持现有路由、认证初始化、Server Functions 和业务服务行为不变。

## 3. 非目标

第一阶段明确不做：

- 不做运行时动态插件加载。
- 不做自动发现 `src/modules/*/module.ts`。
- 不做模块启停、热插拔或远程插件市场。
- 不接管 TanStack Start 文件路由。
- 不替换 Better Auth 的 server/client plugin 组装方式。
- 不大规模迁移所有模块。
- 不把尚未稳定的内部函数包装成虚假的 service contract。

这些能力不是永远不能做，而是不适合作为第一阶段基础设施。当前最重要的是先把模块边界、注册入口和通信方式稳定下来。

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

第一阶段已经形成以下基础文件：

```text
src/
├── core/
│   ├── event-bus.ts
│   └── module-registry.ts
└── modules/
    ├── auth/
    │   └── module.ts
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
export const moduleRegistry = createModuleRegistry([authModule] as const)
```

后续新增模块时，应优先在这里显式注册，而不是引入自动扫描。

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

### 6.3 Typed Event Bus：用于跨模块副作用

适用场景：

- 用户创建后触发欢迎消息、审计、初始化设置。
- 支付成功后触发订单状态、通知、权益开通。
- 系统配置更新后通知缓存刷新。

事件适合表达“已经发生的事实”，不适合表达“必须立即返回结果的查询”。

### 6.4 TanStack Query invalidation：用于 UI server-state 同步

前端数据刷新仍然应优先使用 TanStack Query 的 query key 和 invalidation。不要用 Event Bus 替代 TanStack Query 的缓存一致性机制。

### 6.5 Server Functions：用于同源前后端动作入口

Server Functions 仍是页面、hooks、TanStack Query 到服务端业务逻辑的主要入口。模块系统不替代 Server Functions，只帮助业务能力边界更清晰。

## 7. 推荐演进路径

### Phase 1：基础骨架

当前阶段目标：

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

### Phase 2：支付模块接入

建议下一个模块选择 `payment`，原因是它和 `auth` 有真实依赖关系，能验证模块边界是否有价值。

可做内容：

- 新增 `src/modules/payment/module.ts`。
- 声明 `payment` 的 `key`、`version`、`dependencies: ['auth']`。
- 只暴露稳定的 payment service 或事件名。
- 支付成功、退款、关闭订单等事实可以转成 typed events。

不要做：

- 不重写支付路由。
- 不移动所有 payment 文件。
- 不引入新的支付抽象层覆盖现有 service。

### Phase 3：模块事件规范

当第二个模块接入后，再补充统一事件命名规范：

```text
<module>.<domain>.<past-tense-action>
auth.user.created
payment.order.paid
config.runtime.updated
```

同时建立 `AppEvents` 类型聚合位置。候选位置：

- `src/modules/events.ts`
- 或 `src/core/app-events.ts`

优先推荐放在应用层而不是 `core`，因为 `core` 不应依赖业务事件。

### Phase 4：服务契约收敛

当模块间出现 2 到 3 个稳定同步调用后，再考虑引入 service contract 聚合。这个阶段再定义：

- 服务命名方式。
- 服务注册方式。
- 服务是否允许依赖 registry。
- 服务如何测试。

不要过早做通用 DI 容器。当前项目更需要边界清晰，而不是容器复杂度。

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

## 10. 当前结论

这个方案可行，但前提是保持克制：它不是完整运行时插件平台，而是一个编译期显式的模块协调层。

当前最合理的方向是：

1. 保留 TanStack Start 作为路由和 SSR 框架。
2. 保留 Better Auth 作为认证插件系统。
3. 用 `moduleRegistry` 明确模块清单和能力边界。
4. 用 typed Event Bus 处理跨模块副作用。
5. 逐个模块渐进接入，先从 `auth`，再到 `payment`，最后再考虑 admin 子域拆分。

这能让项目走向“多模块、可插拔”的基础开发框架，同时避免一开始就引入过重、与现有栈冲突的动态插件系统。
