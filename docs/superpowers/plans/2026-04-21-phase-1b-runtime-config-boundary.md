# Phase 1B: Runtime Config 基础设施收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 runtime config 读取侧正式收口到 `src/infrastructure/config/*`，同时保持现有调用方 contract 不变。

**Architecture:** 读取侧拆成 `defaults + store + facade` 三层：默认值与类型归一化独立、缓存与 DB 覆盖独立、对外 API 由 façade 统一暴露。`src/shared/config/runtime-config.ts` 仅保留 compatibility shim，admin `RuntimeConfigService.refresh()` 继续记录审计，但刷新逻辑改为调用新基础设施入口。

**Tech Stack:** TanStack Start, Prisma, TypeScript, Vitest

---

### Task 1: 抽出 runtime config defaults 与 normalize 逻辑

**Files:**
- Create: `src/infrastructure/config/runtime-config-defaults.ts`
- Modify: `src/shared/config/runtime-config.ts`
- Test: `src/infrastructure/config/runtime-config-store.test.ts`

- [ ] **Step 1: 写读取侧行为测试，先锁定 env 默认值与 normalize 行为**

```ts
import { describe, expect, it } from 'vitest'
import { buildRuntimeConfigDefaults, normalizeRuntimeConfigValue } from './runtime-config-defaults'

describe('runtime-config defaults', () => {
  it('builds defaults from env', () => {
    const defaults = buildRuntimeConfigDefaults({
      AI_PROVIDER: 'openai',
      ENABLE_AI: 'true',
      LOG_DIR: 'custom-logs',
    } as NodeJS.ProcessEnv)

    expect(defaults['ai.provider']).toBe('openai')
    expect(defaults['ai.enabled']).toBe(true)
    expect(defaults['log.dir']).toBe('custom-logs')
  })

  it('normalizes string array values', () => {
    const defaults = buildRuntimeConfigDefaults({} as NodeJS.ProcessEnv)
    const value = normalizeRuntimeConfigValue('auth.trustedOrigins', 'https://a.com, https://b.com', defaults)

    expect(value).toEqual(['https://a.com', 'https://b.com'])
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: FAIL，因为 `runtime-config-defaults.ts` 尚不存在。

- [ ] **Step 3: 实现 defaults 与 normalize 逻辑**

```ts
// src/infrastructure/config/runtime-config-defaults.ts
export type RuntimeConfigShape = { /* 从 shared/config 迁移现有定义 */ }
export type RuntimeConfigKey = keyof RuntimeConfigShape

export function buildRuntimeConfigDefaults(env: NodeJS.ProcessEnv = process.env): RuntimeConfigShape {
  // 迁移当前 getDefaultsFromEnv 逻辑
}

export function normalizeRuntimeConfigValue<K extends RuntimeConfigKey>(
  key: K,
  raw: unknown,
  defaults: RuntimeConfigShape,
): RuntimeConfigShape[K] {
  // 迁移当前 normalizeValue 逻辑
}
```

- [ ] **Step 4: 运行测试确认 defaults 模块可用**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: 仍可能 FAIL，但应从“文件缺失”推进到 store 相关失败。

- [ ] **Step 5: 提交 defaults 模块拆分**

```bash
git add src/infrastructure/config/runtime-config-defaults.ts
git commit -m "refactor(config): 拆分运行时配置默认值模块"
```

### Task 2: 抽出 runtime config store 与 DB 覆盖逻辑

**Files:**
- Create: `src/infrastructure/config/runtime-config-store.ts`
- Create: `src/infrastructure/config/runtime-config-store.test.ts`
- Modify: `src/infrastructure/config/runtime-config-defaults.ts`

- [ ] **Step 1: 为 store 行为写失败测试**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createRuntimeConfigStore } from './runtime-config-store'

describe('runtime-config store', () => {
  it('uses database values to override defaults', async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      { key: 'ai.model', value: '"gpt-5.4-mini"' },
      { key: 'auth.trustedOrigins', value: '["https://app.example.com"]' },
    ])

    const store = createRuntimeConfigStore({
      env: {} as NodeJS.ProcessEnv,
      getDb: async () => ({ $queryRaw: queryRaw }),
      now: () => 1,
    })

    await store.load()

    expect(store.get('ai.model')).toBe('gpt-5.4-mini')
    expect(store.get('auth.trustedOrigins')).toEqual(['https://app.example.com'])
  })

  it('falls back to defaults when db read fails', async () => {
    const store = createRuntimeConfigStore({
      env: { AI_PROVIDER: 'gemini' } as NodeJS.ProcessEnv,
      getDb: async () => {
        throw new Error('table missing')
      },
      now: () => 2,
    })

    await store.load()

    expect(store.get('ai.provider')).toBe('gemini')
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: FAIL，因为 `runtime-config-store.ts` 尚不存在。

- [ ] **Step 3: 实现 store**

```ts
// src/infrastructure/config/runtime-config-store.ts
import { getDb } from '~/shared/lib/db'
import { buildRuntimeConfigDefaults, normalizeRuntimeConfigValue, type RuntimeConfigKey } from './runtime-config-defaults'

export function createRuntimeConfigStore(/* inject env/getDb/now */) {
  // 迁移当前 global store、TTL、parseDbValue、load/refresh/get 行为
}
```

- [ ] **Step 4: 跑 store 测试**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: PASS

- [ ] **Step 5: 提交 store 模块**

```bash
git add src/infrastructure/config/runtime-config-store.ts src/infrastructure/config/runtime-config-store.test.ts src/infrastructure/config/runtime-config-defaults.ts
git commit -m "refactor(config): 抽出运行时配置缓存存储"
```

### Task 3: 建立 infrastructure facade 并保留 shared compatibility shim

**Files:**
- Create: `src/infrastructure/config/runtime-config.ts`
- Modify: `src/shared/config/runtime-config.ts`
- Modify: `src/modules/admin/features/system-config/services/runtime-config.service.ts`
- Test: `src/infrastructure/config/runtime-config-store.test.ts`

- [ ] **Step 1: 写一个兼容层测试，锁定旧 API 仍可工作**

```ts
import { describe, expect, it } from 'vitest'
import { getRuntimeConfig } from '~/shared/config/runtime-config'

describe('runtime-config compatibility shim', () => {
  it('re-exports getRuntimeConfig from infrastructure entry', () => {
    expect(typeof getRuntimeConfig).toBe('function')
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败或尚未覆盖 facade**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: 若 facade 未建立，测试会因导出缺失失败。

- [ ] **Step 3: 实现 facade 与兼容层**

```ts
// src/infrastructure/config/runtime-config.ts
import { createRuntimeConfigStore } from './runtime-config-store'

const runtimeConfigStore = createRuntimeConfigStore()

export async function initRuntimeConfig(options?: { force?: boolean }) {
  await runtimeConfigStore.load(options)
}

export function getRuntimeConfig(key) {
  return runtimeConfigStore.get(key)
}

export async function refreshRuntimeConfig() {
  return runtimeConfigStore.refresh()
}

export function getPublicRuntimeConfig() {
  return {
    'ai.enabled': getRuntimeConfig('ai.enabled'),
    'ai.provider': getRuntimeConfig('ai.provider'),
    'ai.model': getRuntimeConfig('ai.model'),
    'ai.systemPrompt': getRuntimeConfig('ai.systemPrompt'),
  }
}
```

```ts
// src/shared/config/runtime-config.ts
export {
  getPublicRuntimeConfig,
  getRuntimeConfig,
  initRuntimeConfig,
  refreshRuntimeConfig,
} from '~/infrastructure/config/runtime-config'
export type {
  RuntimeConfigKey,
  RuntimeConfigShape,
} from '~/infrastructure/config/runtime-config-defaults'
```

```ts
// src/modules/admin/features/system-config/services/runtime-config.service.ts
import { refreshRuntimeConfig } from '~/infrastructure/config/runtime-config'
```

- [ ] **Step 4: 跑定向测试**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: PASS

- [ ] **Step 5: 提交 facade 与兼容层**

```bash
git add src/infrastructure/config/runtime-config.ts src/shared/config/runtime-config.ts src/modules/admin/features/system-config/services/runtime-config.service.ts
git commit -m "refactor(config): 收口运行时配置读取入口"
```

### Task 4: 运行最终定向验证并补文档同步

**Files:**
- Modify: `docs/superpowers/plans/2026-04-21-phase-1b-runtime-config-boundary.md`
- Modify: `docs/superpowers/specs/2026-04-21-runtime-config-boundary-design.md`

- [ ] **Step 1: 运行定向测试**

Run: `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`

Expected: PASS

- [ ] **Step 2: 运行调用侧 smoke tests（如存在）**

Run: `pnpm vitest run src/modules/auth/shared/lib/safe-redirect.test.ts`

Expected: PASS，证明本轮没有影响现有 auth 轻量测试基线。

- [ ] **Step 3: 运行定向 typecheck 筛选**

Run:

```powershell
$output = pnpm exec tsc --noEmit 2>&1
$output | Select-String -Pattern 'src/infrastructure/config|src/shared/config/runtime-config|runtime-config.service'
```

Expected: 不出现本轮新增文件相关错误；若仓库仍有既有全量 `tsc` 错误，单独记录但不夸大为本轮回归。

- [ ] **Step 4: 同步计划状态并提交**

```bash
git add docs/superpowers/specs/2026-04-21-runtime-config-boundary-design.md docs/superpowers/plans/2026-04-21-phase-1b-runtime-config-boundary.md
git commit -m "docs(plan): 补充运行时配置收口方案"
```

## 2026-04-28 执行记录

本轮已完成 Phase 1B runtime config 读取侧收口：

- `src/infrastructure/config/runtime-config-defaults.ts`：拆出 `RuntimeConfigShape`、`RuntimeConfigKey`、env 默认值构建与单值归一化。
- `src/infrastructure/config/runtime-config-store.ts`：拆出缓存、TTL、DB 覆盖读取、缺表 fallback 和 refresh。
- `src/infrastructure/config/runtime-config.ts`：作为新的正式读取 facade。
- `src/shared/config/runtime-config.ts`：保留为 compatibility shim，对外 contract 不变。
- `src/modules/admin/features/system-config/services/runtime-config.service.ts`：刷新入口改为调用 infrastructure facade，审计逻辑仍保留在 admin service。
- `src/infrastructure/config/runtime-config-store.test.ts`：覆盖 defaults、normalize、DB 覆盖、fallback 和 shared shim。

验证结果：

- `pnpm vitest run src/infrastructure/config/runtime-config-store.test.ts`：5 tests passed。
- `pnpm vitest run src/infrastructure/db/database-url.test.ts src/modules/payment/shared/services/create-prepay-order.service.test.ts src/modules/payment/shared/server-fns/prepay.test.ts src/infrastructure/config/runtime-config-store.test.ts`：11 tests passed。
- `pnpm vitest run src/modules/auth/shared/lib/safe-redirect.test.ts`：4 tests passed。
- `pnpm exec eslint src/infrastructure/config/runtime-config-defaults.ts src/infrastructure/config/runtime-config-store.ts src/infrastructure/config/runtime-config.ts src/infrastructure/config/runtime-config-store.test.ts src/shared/config/runtime-config.ts src/modules/admin/features/system-config/services/runtime-config.service.ts`：0 errors。
- `pnpm exec tsc --noEmit --pretty false`：exit code 2；过滤本轮改动路径后无匹配错误，属于既有全仓 typecheck 基线未清理。
