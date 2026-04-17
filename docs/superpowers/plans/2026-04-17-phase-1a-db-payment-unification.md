# Phase 1A: 数据库入口硬化与 Payment Prepay 统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立唯一、安全的 Prisma 数据库入口，并将 `payment prepay` 收敛为一份可被 HTTP Route 和 Server Function 共同复用的业务实现。

**Architecture:** 保留 TanStack Start 的 `routes + server-fns` 组织方式，不新增 controller 层。通过新增 `src/infrastructure/db/*` 建立数据库基础设施边界，再把 payment prepay 的业务编排从 transport 层抽到独立 service，使 `src/routes/api/v1/payment/wechat/prepay.ts` 与 `src/modules/payment/shared/server-fns/prepay.ts` 共享同一用例实现。

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, Prisma, Better Auth, WeChat Pay SDK, TypeScript, Vitest, Bun

---

## 范围与拆分说明

这是架构重构的第一份子计划，只覆盖两个高收益试点：

1. 数据库入口硬化与基础设施边界建立
2. Payment prepay 用例统一

本计划**不包含**以下内容：

- Better Auth 目录整体迁移
- Runtime config 目录整体迁移
- Bun `server.ts` runtime 收口
- `admin` 子域拆分
- `queryOrderStatusFn` / `syncOrderStatusFn` / `closeOrderFn` 重构

这些内容应在后续独立计划中处理。

## 目标文件结构

本计划完成后，相关文件应收敛为如下结构：

```text
src/
├── infrastructure/
│   └── db/
│       ├── database-url.ts
│       ├── database-url.test.ts
│       └── prisma-client.ts
├── modules/
│   └── payment/
│       └── shared/
│           ├── schemas/
│           │   └── prepay.ts
│           ├── services/
│           │   ├── create-prepay-order.service.ts
│           │   └── create-prepay-order.service.test.ts
│           └── server-fns/
│               ├── prepay.ts
│               └── prepay.test.ts
└── shared/
    └── lib/
        ├── database-url.ts      # 兼容层，re-export
        └── db.ts                # 兼容层，re-export
```

## 兼容策略

- `src/shared/lib/database-url.ts` 和 `src/shared/lib/db.ts` 暂时保留，作为 compatibility shim。
- 第一阶段不做全仓 import 替换；仅新增 `infrastructure/db` 的正式入口，并允许已有调用方继续通过旧路径工作。
- `payment prepay` 的对外 contract 保持不变：HTTP route 仍然返回 JSON，Server Function 仍然供站内调用。

## Task 1: 建立数据库基础设施边界并移除危险默认值

**Files:**
- Create: `src/infrastructure/db/database-url.ts`
- Create: `src/infrastructure/db/database-url.test.ts`
- Create: `src/infrastructure/db/prisma-client.ts`
- Modify: `src/shared/lib/database-url.ts`
- Modify: `src/shared/lib/db.ts`
- Test: `src/infrastructure/db/database-url.test.ts`

- [ ] **Step 1: 写数据库 URL 规则的失败测试**

```ts
// src/infrastructure/db/database-url.test.ts
import { describe, expect, it } from 'vitest'
import { getDatabaseUrl } from './database-url'

describe('getDatabaseUrl', () => {
  it('normalizes relative sqlite urls against cwd', () => {
    const value = getDatabaseUrl({
      cwd: 'Z:/labs/start-basic',
      env: {
        DATABASE_URL: 'file:./db/dev.db',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe('file:Z:/labs/start-basic/db/dev.db')
  })

  it('keeps absolute postgres urls unchanged', () => {
    const value = getDatabaseUrl({
      cwd: 'Z:/labs/start-basic',
      env: {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/app?schema=public',
      } as NodeJS.ProcessEnv,
    })

    expect(value).toBe('postgresql://user:pass@localhost:5432/app?schema=public')
  })

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      getDatabaseUrl({
        cwd: 'Z:/labs/start-basic',
        env: {} as NodeJS.ProcessEnv,
      }),
    ).toThrow('DATABASE_URL is required')
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败**

Run: `pnpm vitest run src/infrastructure/db/database-url.test.ts`

Expected: FAIL，原因是 `src/infrastructure/db/database-url.ts` 尚不存在，且当前实现仍有硬编码 fallback。

- [ ] **Step 3: 实现新的 infrastructure/db 入口，并保留 shared 兼容层**

```ts
// src/infrastructure/db/database-url.ts
import path from 'node:path'

type GetDatabaseUrlOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

function normalizeDatabaseUrl(url: string, cwd: string): string {
  if (!url.startsWith('file:')) {
    return url
  }

  const rest = url.slice('file:'.length)

  if (rest.startsWith('//') || rest.startsWith('/')) {
    return url
  }

  const absPath = path.resolve(cwd, rest)
  return `file:${absPath.replace(/\\/g, '/')}`
}

export function getDatabaseUrl(options?: GetDatabaseUrlOptions): string {
  const cwd = options?.cwd ?? process.cwd()
  const env = options?.env ?? process.env
  const fromEnv = env.DATABASE_URL?.trim()

  if (!fromEnv) {
    throw new Error('DATABASE_URL is required')
  }

  return normalizeDatabaseUrl(fromEnv, cwd)
}
```

```ts
// src/infrastructure/db/prisma-client.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '~/generated/prisma/client'
import { getDatabaseUrl } from './database-url'

const DATABASE_URL = getDatabaseUrl()
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

async function createPrismaClient(): Promise<PrismaClient> {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter })
}

export async function getDb(): Promise<PrismaClient> {
  globalForPrisma.prisma ??= await createPrismaClient()
  return globalForPrisma.prisma
}

let prismaInstance: PrismaClient | null = null

async function initPrisma(): Promise<PrismaClient> {
  prismaInstance ??= await getDb()
  return prismaInstance
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined
    if (!prismaInstance) {
      throw new Error('Prisma client not initialized. Call await getDb() or getDbSync() first.')
    }
    return (prismaInstance as PrismaClient & Record<PropertyKey, unknown>)[prop]
  },
})

export function getDbSync(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('Prisma client not initialized.')
  }
  return prismaInstance
}

if (typeof window === 'undefined') {
  initPrisma().catch(console.error)
}

export default prisma
```

```ts
// src/shared/lib/database-url.ts
export { getDatabaseUrl } from '~/infrastructure/db/database-url'
```

```ts
// src/shared/lib/db.ts
export { default, getDb, getDbSync } from '~/infrastructure/db/prisma-client'
```

- [ ] **Step 4: 运行测试与类型检查，确认数据库边界改造通过**

Run: `pnpm vitest run src/infrastructure/db/database-url.test.ts`

Expected: PASS

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 5: 提交数据库基础设施边界收口**

```bash
git add src/infrastructure/db/database-url.ts src/infrastructure/db/database-url.test.ts src/infrastructure/db/prisma-client.ts src/shared/lib/database-url.ts src/shared/lib/db.ts
git commit -m "refactor(infrastructure): 收口数据库访问入口"
```

## Task 2: 提取 payment prepay 共享 schema 与核心 service

**Files:**
- Create: `src/modules/payment/shared/schemas/prepay.ts`
- Create: `src/modules/payment/shared/services/create-prepay-order.service.ts`
- Create: `src/modules/payment/shared/services/create-prepay-order.service.test.ts`
- Test: `src/modules/payment/shared/services/create-prepay-order.service.test.ts`

- [ ] **Step 1: 为 prepay 核心用例写失败测试**

```ts
// src/modules/payment/shared/services/create-prepay-order.service.test.ts
import { describe, expect, it, vi } from 'vitest'
import { createPrepayOrder } from './create-prepay-order.service'

const input = {
  amount: 100,
  description: 'VIP 会员',
  paymentMethod: 'WECHAT_NATIVE' as const,
  attach: 'plan=vip',
}

describe('createPrepayOrder', () => {
  it('creates a native order and returns codeUrl', async () => {
    const paymentOrderCreate = vi.fn().mockResolvedValue({ id: 'order_1' })
    const transactionsNative = vi.fn().mockResolvedValue({ code_url: 'weixin://code' })

    const result = await createPrepayOrder(input, {
      sessionUserId: 'user_1',
      notifyUrl: 'https://example.com/api/payment/wechat/notify',
      prisma: {
        paymentOrder: {
          create: paymentOrderCreate,
          update: vi.fn(),
        },
        account: {
          findFirst: vi.fn(),
        },
      },
      wechatPayClient: {
        transactionsNative,
        transactionsJSAPI: vi.fn(),
      },
      createOutTradeNo: () => 'trade_1',
    })

    expect(paymentOrderCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        outTradeNo: 'trade_1',
        amount: 100,
        description: 'VIP 会员',
        paymentMethod: 'WECHAT_NATIVE',
        status: 'PENDING',
        metadata: { attach: 'plan=vip' },
      },
    })

    expect(transactionsNative).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      orderId: 'order_1',
      outTradeNo: 'trade_1',
      codeUrl: 'weixin://code',
    })
  })

  it('marks the order failed when the payment sdk throws', async () => {
    const paymentOrderUpdate = vi.fn().mockResolvedValue({})

    await expect(
      createPrepayOrder(input, {
        sessionUserId: 'user_1',
        notifyUrl: 'https://example.com/api/payment/wechat/notify',
        prisma: {
          paymentOrder: {
            create: vi.fn().mockResolvedValue({ id: 'order_2' }),
            update: paymentOrderUpdate,
          },
          account: {
            findFirst: vi.fn(),
          },
        },
        wechatPayClient: {
          transactionsNative: vi.fn().mockRejectedValue(new Error('sdk down')),
          transactionsJSAPI: vi.fn(),
        },
        createOutTradeNo: () => 'trade_2',
      }),
    ).rejects.toThrow('Payment request failed: sdk down')

    expect(paymentOrderUpdate).toHaveBeenCalledWith({
      where: { id: 'order_2' },
      data: { status: 'FAILED' },
    })
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败**

Run: `pnpm vitest run src/modules/payment/shared/services/create-prepay-order.service.test.ts`

Expected: FAIL，原因是 `create-prepay-order.service.ts` 与 `schemas/prepay.ts` 尚不存在。

- [ ] **Step 3: 写共享 schema 与核心 service**

```ts
// src/modules/payment/shared/schemas/prepay.ts
import { z } from 'zod'

export const PrepayRequestSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(127),
  paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5']),
  openid: z.string().optional(),
  attach: z.string().optional(),
})

export type PrepayRequestInput = z.infer<typeof PrepayRequestSchema>
```

```ts
// src/modules/payment/shared/services/create-prepay-order.service.ts
import type { PrepayRequestInput } from '../schemas/prepay'

type PaymentOrderPrisma = {
  paymentOrder: {
    create(args: {
      data: {
        userId: string
        outTradeNo: string
        amount: number
        description: string
        paymentMethod: PrepayRequestInput['paymentMethod']
        status: 'PENDING' | 'FAILED'
        metadata?: { attach: string }
      }
    }): Promise<{ id: string }>
    update(args: {
      where: { id: string }
      data: { status: 'FAILED' }
    }): Promise<unknown>
  }
  account: {
    findFirst(args: {
      where: { userId: string; providerId: 'wechat' }
      select: { idToken: true }
    }): Promise<{ idToken: string | null } | null>
  }
}

type WeChatPayGateway = {
  transactionsNative(params: {
    description: string
    out_trade_no: string
    notify_url: string
    amount: { total: number; currency: 'CNY' }
    attach?: string
  }): Promise<{ code_url: string }>
  transactionsJSAPI(params: {
    description: string
    out_trade_no: string
    notify_url: string
    amount: { total: number; currency: 'CNY' }
    payer: { openid: string }
    attach?: string
  }): Promise<{
    data?: {
      appId: string
      timeStamp: string
      nonceStr: string
      package: string
      signType?: 'RSA'
      paySign: string
    }
  }>
}

type CreatePrepayOrderDeps = {
  sessionUserId: string | null
  notifyUrl: string
  prisma: PaymentOrderPrisma
  wechatPayClient: WeChatPayGateway
  createOutTradeNo?: () => string
}

function defaultOutTradeNo(): string {
  return `${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function createPrepayOrder(
  input: PrepayRequestInput,
  deps: CreatePrepayOrderDeps,
) {
  if (!deps.sessionUserId) {
    throw new Error('Unauthorized')
  }

  const outTradeNo = deps.createOutTradeNo?.() ?? defaultOutTradeNo()
  const order = await deps.prisma.paymentOrder.create({
    data: {
      userId: deps.sessionUserId,
      outTradeNo,
      amount: input.amount,
      description: input.description,
      paymentMethod: input.paymentMethod,
      status: 'PENDING',
      metadata: input.attach ? { attach: input.attach } : undefined,
    },
  })

  try {
    if (input.paymentMethod === 'WECHAT_NATIVE') {
      const result = await deps.wechatPayClient.transactionsNative({
        description: input.description,
        out_trade_no: outTradeNo,
        notify_url: deps.notifyUrl,
        amount: { total: input.amount, currency: 'CNY' },
        attach: input.attach,
      })

      return {
        orderId: order.id,
        outTradeNo,
        codeUrl: result.code_url,
      }
    }

    let openid = input.openid
    if (!openid) {
      const wechatAccount = await deps.prisma.account.findFirst({
        where: { userId: deps.sessionUserId, providerId: 'wechat' },
        select: { idToken: true },
      })
      openid = wechatAccount?.idToken ?? undefined
    }

    if (!openid) {
      throw new Error('openid is required for JSAPI payment')
    }

    const result = await deps.wechatPayClient.transactionsJSAPI({
      description: input.description,
      out_trade_no: outTradeNo,
      notify_url: deps.notifyUrl,
      amount: { total: input.amount, currency: 'CNY' },
      payer: { openid },
      attach: input.attach,
    })

    const jsapiData = result.data ?? result
    return {
      orderId: order.id,
      outTradeNo,
      prepayId: jsapiData.package?.replace('prepay_id=', ''),
      jsapiParams: {
        appId: jsapiData.appId,
        timeStamp: jsapiData.timeStamp,
        nonceStr: jsapiData.nonceStr,
        package: jsapiData.package,
        signType: jsapiData.signType ?? 'RSA',
        paySign: jsapiData.paySign,
      },
    }
  } catch (error) {
    await deps.prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    })

    throw new Error(
      `Payment request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
```

- [ ] **Step 4: 运行 service 测试，确认核心用例通过**

Run: `pnpm vitest run src/modules/payment/shared/services/create-prepay-order.service.test.ts`

Expected: PASS

- [ ] **Step 5: 提交 prepay 核心 service 提取**

```bash
git add src/modules/payment/shared/schemas/prepay.ts src/modules/payment/shared/services/create-prepay-order.service.ts src/modules/payment/shared/services/create-prepay-order.service.test.ts
git commit -m "refactor(payment): 提取预支付核心用例"
```

## Task 3: 让 server-fn 与 HTTP route 共享同一份 prepay 实现

**Files:**
- Create: `src/modules/payment/shared/server-fns/prepay.test.ts`
- Modify: `src/modules/payment/shared/server-fns/prepay.ts`
- Modify: `src/routes/api/v1/payment/wechat/prepay.ts`
- Test: `src/modules/payment/shared/server-fns/prepay.test.ts`

- [ ] **Step 1: 为 server-fn wrapper 写失败测试，锁定“只做适配，不做主逻辑”**

```ts
// src/modules/payment/shared/server-fns/prepay.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getDb = vi.fn()
const getWeChatPayClient = vi.fn()
const createPrepayOrder = vi.fn()

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => ({
    headers: new Headers([['cookie', 'sid=test']]),
  }),
}))

vi.mock('../../../auth/shared/lib/auth', () => ({
  auth: {
    api: {
      getSession,
    },
  },
}))

vi.mock('~/shared/lib/db', () => ({
  getDb,
}))

vi.mock('../lib/wechat-pay', () => ({
  getWeChatPayClient,
}))

vi.mock('../services/create-prepay-order.service', () => ({
  createPrepayOrder,
}))

describe('createPrepayOrderFn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to createPrepayOrder with session, prisma and gateway', async () => {
    getSession.mockResolvedValue({ user: { id: 'user_1' } })
    getDb.mockResolvedValue({ paymentOrder: {}, account: {} })
    getWeChatPayClient.mockResolvedValue({ transactionsNative: vi.fn(), transactionsJSAPI: vi.fn() })
    createPrepayOrder.mockResolvedValue({ orderId: 'order_1', outTradeNo: 'trade_1', codeUrl: 'weixin://code' })

    const { createPrepayOrderFn } = await import('./prepay')

    const result = await createPrepayOrderFn({
      data: {
        amount: 100,
        description: 'VIP 会员',
        paymentMethod: 'WECHAT_NATIVE',
      },
    })

    expect(createPrepayOrder).toHaveBeenCalledWith(
      {
        amount: 100,
        description: 'VIP 会员',
        paymentMethod: 'WECHAT_NATIVE',
      },
      expect.objectContaining({
        sessionUserId: 'user_1',
        notifyUrl: expect.any(String),
        prisma: expect.any(Object),
        wechatPayClient: expect.any(Object),
      }),
    )

    expect(result).toEqual({
      orderId: 'order_1',
      outTradeNo: 'trade_1',
      codeUrl: 'weixin://code',
    })
  })
})
```

- [ ] **Step 2: 运行测试，确认它失败**

Run: `pnpm vitest run src/modules/payment/shared/server-fns/prepay.test.ts`

Expected: FAIL，原因是当前 `createPrepayOrderFn` 还没有委托到 `createPrepayOrder` service。

- [ ] **Step 3: 改造 server-fn 与 route，让两者共享 schema + service**

```ts
// src/modules/payment/shared/server-fns/prepay.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { PrepayRequestSchema } from '../schemas/prepay'
import { createPrepayOrder } from '../services/create-prepay-order.service'

export const createPrepayOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => PrepayRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { auth } = await import('../../../auth/shared/lib/auth')
    const { getDb } = await import('~/shared/lib/db')
    const { getWeChatPayClient } = await import('../lib/wechat-pay')

    const { headers } = getRequest()!
    const session = await auth.api.getSession({ headers })
    const prisma = await getDb()
    const wechatPayClient = await getWeChatPayClient()

    return createPrepayOrder(data, {
      sessionUserId: session?.user?.id ?? null,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
      prisma,
      wechatPayClient,
    })
  })
```

```ts
// src/routes/api/v1/payment/wechat/prepay.ts
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/modules/auth/shared/lib/auth'
import { PrepayRequestSchema } from '~/modules/payment/shared/schemas/prepay'
import { createPrepayOrder } from '~/modules/payment/shared/services/create-prepay-order.service'
import { getWeChatPayClient } from '~/modules/payment/shared/lib/wechat-pay'
import { getDb } from '~/shared/lib/db'

export const Route = createFileRoute('/api/v1/payment/wechat/prepay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = await auth.api.getSession({ headers: request.headers })

          if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          let bodyRaw: unknown
          try {
            bodyRaw = await request.json()
          } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const parsed = PrepayRequestSchema.safeParse(bodyRaw)
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const prisma = await getDb()
          const wechatPayClient = await getWeChatPayClient()
          const result = await createPrepayOrder(parsed.data, {
            sessionUserId: session.user.id,
            notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
            prisma,
            wechatPayClient,
          })

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Internal Server Error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
```

- [ ] **Step 4: 运行 targeted tests 与 smoke typecheck**

Run: `pnpm vitest run src/modules/payment/shared/services/create-prepay-order.service.test.ts src/modules/payment/shared/server-fns/prepay.test.ts`

Expected: PASS

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 5: 提交 transport 适配层收口**

```bash
git add src/modules/payment/shared/server-fns/prepay.test.ts src/modules/payment/shared/server-fns/prepay.ts src/routes/api/v1/payment/wechat/prepay.ts
git commit -m "refactor(payment): 统一预支付入口实现"
```

## Task 4: 做一轮端到端回归验证并记录结果

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Test: `src/infrastructure/db/database-url.test.ts`
- Test: `src/modules/payment/shared/services/create-prepay-order.service.test.ts`
- Test: `src/modules/payment/shared/server-fns/prepay.test.ts`

- [ ] **Step 1: 补一条架构文档更新，记录本阶段已建立的正式边界**

```md
## 补充说明：Phase 1A 已落地边界

- 正式数据库入口迁移至 `src/infrastructure/db/*`
- `src/shared/lib/database-url.ts` 与 `src/shared/lib/db.ts` 暂作为兼容层
- `payment prepay` 已统一为一份 core service，由 HTTP route 与 Server Function 共同复用
```

- [ ] **Step 2: 运行本阶段完整验证**

Run: `pnpm vitest run src/infrastructure/db/database-url.test.ts src/modules/payment/shared/services/create-prepay-order.service.test.ts src/modules/payment/shared/server-fns/prepay.test.ts`

Expected: PASS

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 做手动 smoke checklist**

Run:

```bash
pnpm dev
```

Manual checklist:

- 访问需要登录的页面，确认应用未因 `DATABASE_URL` 改动在启动时报错
- 使用有效登录态请求 `/api/v1/payment/wechat/prepay`，确认返回 `200` 且结构与改造前兼容
- 无登录态请求 `/api/v1/payment/wechat/prepay`，确认返回 `401`
- 验证站内仍可通过 `createPrepayOrderFn` 发起预支付

Expected: 所有行为与改造前兼容，且未出现重复逻辑分叉。

- [ ] **Step 4: 提交文档与验证结果**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs(architecture): 更新阶段一架构边界"
```

## 后续计划入口

本计划完成后，下一份计划应优先处理以下任一方向：

1. `auth + runtime-config` 迁入 `infrastructure/*`
2. `payment query/sync/close` 用例统一
3. `admin` 子域拆分第一批试点

