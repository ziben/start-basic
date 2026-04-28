# Runtime Config 基础设施收口设计

## 1. 背景

`start-basic` 的 `runtime config` 当前同时承担了三类职责：

1. 从 `.env` 推导默认值
2. 从 `system_config` 表加载运行时覆盖值
3. 在进程内维护缓存并向业务代码暴露读取 API

这些职责目前混合在 [runtime-config.ts](/Z:/labs/start-basic/src/shared/config/runtime-config.ts) 中，而 admin 侧的配置写入与刷新又在 [runtime-config.service.ts](/Z:/labs/start-basic/src/modules/admin/features/system-config/services/runtime-config.service.ts) 中重复依赖同一套底层能力。结果是：

- 基础设施边界仍停留在 `shared/config`
- 读取侧和写入侧对“配置主入口”的认知不一致
- 某些调用方需要记住“先 `initRuntimeConfig()` 再 `getRuntimeConfig()`”这一隐式约束
- 后续如果继续收口 `auth init`、`server.ts`，会继续把模糊边界放大

上一张 phase-1a 计划已经完成了数据库入口和 payment prepay 的第一批试点。下一张最小切片应继续留在 phase-1 的“基础设施收口”范围内，而不是直接跨到更重的 `auth` 或 `runtime` 大改。

## 2. 目标

本次子设计只解决一个问题：

将 `runtime config` 的读取侧正式收口到 `src/infrastructure/config/*`，并让现有业务调用方继续通过兼容层工作。

具体目标：

1. 建立 `runtime config` 的正式基础设施边界
2. 把“默认值解析 / DB 覆盖加载 / 进程缓存”从 `shared/config` 中迁出
3. 保持现有 `getRuntimeConfig` / `initRuntimeConfig` / `refreshRuntimeConfig` / `getPublicRuntimeConfig` 的对外 contract 不变
4. 让 admin `system-config` 的 refresh 行为调用同一份基础设施实现
5. 为下一步 `auth init` 收口提供稳定的配置读取主入口

## 3. 非目标

本次设计明确不做以下事情：

- 不改 `system_config` 表结构
- 不改 admin system-config 页面、hooks 或 server-fn contract
- 不重写 `auth` 初始化流程
- 不收口 `server.ts`
- 不做全仓 import 批量替换
- 不新增多级 config repository / provider 抽象

## 4. 方案比较

### 方案 A：维持 `shared/config/runtime-config.ts`，只补测试

优点：

- 改动最小
- 风险最低

缺点：

- 基础设施边界问题没有解决
- 后续 `auth` / `runtime` 仍会继续依赖模糊目录
- phase-1 的“收口”目标没有真正前进

结论：不选。它只是在旧边界上继续堆代码。

### 方案 B：建立 `infrastructure/config` 正式入口，`shared/config` 保留兼容层

优点：

- 与 phase-1a 的 DB 收口方式一致
- 外部 contract 可保持稳定
- 可以把读取侧底层逻辑集中到明确目录
- 为后续 `auth init` 提供自然依赖点

缺点：

- 需要拆分文件职责
- 需要补一轮定向测试

结论：推荐。本次设计采用该方案。

### 方案 C：直接把读取侧与 admin 写入侧统一成一个大 `RuntimeConfigService`

优点：

- “看起来”入口统一

缺点：

- 读取基础设施与 admin 业务写入职责混在一起
- `modules/admin` 会继续承载全局基础设施
- 与当前“先收底层边界，再统一业务实现”的路线冲突

结论：不选。它会让 `admin` 超级模块继续膨胀。

## 5. 目标结构

本次收口完成后，相关文件应整理为：

```text
src/
├── infrastructure/
│   └── config/
│       ├── runtime-config-defaults.ts
│       ├── runtime-config-store.ts
│       ├── runtime-config-store.test.ts
│       └── runtime-config.ts
├── shared/
│   └── config/
│       └── runtime-config.ts      # compatibility shim
└── modules/
    └── admin/
        └── features/
            └── system-config/
                └── services/
                    └── runtime-config.service.ts
```

说明：

- `runtime-config-defaults.ts` 负责 `.env` 默认值与类型归一化
- `runtime-config-store.ts` 负责缓存、DB 加载与刷新
- `runtime-config.ts` 负责对外暴露稳定 API
- `shared/config/runtime-config.ts` 只做 re-export，作为过渡兼容层

## 6. 职责划分

### 6.1 `src/infrastructure/config/runtime-config-defaults.ts`

职责：

- 定义 `RuntimeConfigShape`
- 定义 `RuntimeConfigKey`
- 解析 env 默认值
- 归一化单个配置值

不负责：

- 数据库访问
- 缓存
- 刷新副作用

### 6.2 `src/infrastructure/config/runtime-config-store.ts`

职责：

- 管理进程内 store
- 通过 Prisma 读取 `system_config`
- 将 DB 值覆盖到默认值上
- 提供 refresh / load 行为

不负责：

- 暴露业务友好的高层读取 API
- admin 写入审计

### 6.3 `src/infrastructure/config/runtime-config.ts`

职责：

- 暴露 `initRuntimeConfig`
- 暴露 `getRuntimeConfig`
- 暴露 `refreshRuntimeConfig`
- 暴露 `getPublicRuntimeConfig`

它是读取侧的正式主入口。

### 6.4 `src/shared/config/runtime-config.ts`

职责：

- 暂时 re-export `~/infrastructure/config/runtime-config`

这是兼容层，不再承载真实实现。

### 6.5 `RuntimeConfigService.refresh`

职责保持不变：

- 继续负责 admin 侧手动 refresh 的审计记录

但它不再直接依赖 `shared/config` 的真实实现，而是调用正式基础设施入口。

## 7. 迁移策略

本次迁移采用与 DB 收口相同的“新边界 + 兼容层”策略：

1. 先新增 `src/infrastructure/config/*`
2. 再把现有 `shared/config/runtime-config.ts` 改成 re-export
3. 第一轮不做全仓 import 替换
4. admin refresh 逻辑改为调用新的正式入口
5. 用定向测试覆盖读取侧行为

这样可以保证：

- 现有调用点不需要一次性迁移
- 业务 contract 不变
- 下一阶段可以逐步把调用方切到 `~/infrastructure/config/runtime-config`

## 8. 风险与应对

### 风险 1：缓存语义在拆分过程中变动

应对：

- 保持现有 `CACHE_TTL_MS`
- 保持 `force` 刷新语义
- 通过测试锁定“默认值 + DB 覆盖 + 缺表 fallback”行为

### 风险 2：读取入口迁移后 admin refresh 不再记录审计

应对：

- 只把读取基础设施迁走
- admin `refresh` 的审计记录逻辑保留在 `RuntimeConfigService`

### 风险 3：调用方继续依赖旧路径，后续边界感不明显

应对：

- 保留 compatibility shim
- 在文档中明确 `infrastructure/config` 才是正式入口
- 后续 `auth init` 计划直接依赖新入口

## 9. 实施状态

2026-04-28 已按方案 B 完成读取侧收口：

- 新增 `src/infrastructure/config/runtime-config-defaults.ts`，承载默认值与类型归一化。
- 新增 `src/infrastructure/config/runtime-config-store.ts`，承载进程缓存、DB 覆盖读取与 refresh。
- 新增 `src/infrastructure/config/runtime-config.ts`，作为正式读取入口。
- `src/shared/config/runtime-config.ts` 已改为 compatibility shim。
- admin 手动刷新继续保留审计逻辑，但调用入口已切到 `~/infrastructure/config/runtime-config`。

验证记录：

- `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts` 通过。
- `pnpm vitest run src/infrastructure/db/database-url.test.ts src/modules/payment/shared/services/create-prepay-order.service.test.ts src/modules/payment/shared/server-fns/prepay.test.ts src/infrastructure/config/runtime-config-store.test.ts` 通过。
- `pnpm vitest run src/modules/auth/shared/lib/safe-redirect.test.ts` 通过。
- `pnpm exec eslint` 针对本次改动文件通过。
- `pnpm exec tsc --noEmit --pretty false` 仍返回既有全仓错误，但未匹配到本次改动路径相关错误。

## 9. 验收标准

完成后应满足：

1. `runtime config` 读取侧真实实现位于 `src/infrastructure/config/*`
2. `src/shared/config/runtime-config.ts` 仅作为兼容层存在
3. `getRuntimeConfig` / `initRuntimeConfig` / `refreshRuntimeConfig` / `getPublicRuntimeConfig` 的对外 contract 不变
4. admin refresh 仍能通过同一套基础设施刷新缓存并记录变更日志
5. 至少有一组定向测试覆盖默认值、DB 覆盖、缺表 fallback

## 10. 推荐执行顺序

1. 抽出 defaults / normalize 逻辑
2. 抽出 store / DB 加载逻辑并补测试
3. 建立 infrastructure 主入口
4. 把 shared/config 改成兼容层
5. 调整 admin refresh 依赖
6. 跑定向测试
