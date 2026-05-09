# Module Framework Phase 2 Payment Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `payment` 接入现有模块注册入口，并建立应用级 typed event bus 的最小可用骨架。

**Architecture:** 保持 TanStack Start 路由和 Better Auth 初始化链路不变。`paymentModule` 只声明稳定服务、模块依赖和事件名，`src/modules/events.ts` 负责聚合业务事件类型并创建应用级 event bus。

**Tech Stack:** TanStack Start, TypeScript, Vitest, in-process typed event bus.

---

### Task 1: Add App Events

**Files:**
- Create: `src/modules/events.ts`
- Test: `src/modules/events.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createAppEventBus } from './events'

describe('app events', () => {
  it('emits typed payment events', async () => {
    const bus = createAppEventBus()
    const handler = vi.fn()

    bus.on('payment.order.paid', handler)

    await bus.emit('payment.order.paid', {
      orderId: 'order_1',
      userId: 'user_1',
      outTradeNo: 'trade_1',
      transactionId: 'tx_1',
      paidAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order_1',
      transactionId: 'tx_1',
    }))
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/modules/events.test.ts`

Expected: FAIL because `src/modules/events.ts` does not exist.

- [x] **Step 3: Implement event types and bus factory**

```ts
import { createEventBus, type EventBus } from '~/core/event-bus'

export interface AppEvents {
  'auth.user.created': {
    userId: string
    email: string
  }
  'payment.order.paid': {
    orderId: string
    userId: string
    outTradeNo: string
    transactionId?: string
    paidAt: Date
  }
}

export type AppEventBus = EventBus<AppEvents>

export function createAppEventBus(): AppEventBus {
  return createEventBus<AppEvents>()
}

export const appEventBus = createAppEventBus()
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/modules/events.test.ts`

Expected: PASS.

### Task 2: Register Payment Module

**Files:**
- Create: `src/modules/payment/module.ts`
- Modify: `src/modules/index.ts`
- Test: `src/modules/payment/module.test.ts`, `src/modules/index.test.ts`

- [x] **Step 1: Write failing module tests**

```ts
import { describe, expect, it } from 'vitest'
import { createPrepayOrder } from './shared/services/create-prepay-order.service'
import { closePaymentOrder, queryPaymentOrderStatus, syncPaymentOrderStatus } from './shared/services/payment-order-status.service'
import { paymentModule } from './module'

describe('paymentModule', () => {
  it('declares auth dependency, stable services, and event names', () => {
    expect(paymentModule.key).toBe('payment')
    expect(paymentModule.dependencies).toEqual(['auth'])
    expect(paymentModule.exports?.services).toEqual({
      createPrepayOrder,
      queryPaymentOrderStatus,
      syncPaymentOrderStatus,
      closePaymentOrder,
    })
    expect(paymentModule.exports?.events).toEqual({
      orderPaid: 'payment.order.paid',
      orderClosed: 'payment.order.closed',
      orderFailed: 'payment.order.failed',
    })
  })
})
```

- [x] **Step 2: Write failing registry test**

```ts
import { describe, expect, it } from 'vitest'
import { authModule, moduleRegistry, paymentModule } from './index'

describe('moduleRegistry', () => {
  it('registers auth and payment explicitly', () => {
    expect(moduleRegistry.modules).toEqual([authModule, paymentModule])
    expect(moduleRegistry.getModule('payment')).toBe(paymentModule)
    expect(moduleRegistry.getModule('payment').dependencies).toContain('auth')
  })
})
```

- [x] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run src/modules/payment/module.test.ts src/modules/index.test.ts`

Expected: FAIL because `paymentModule` is not implemented or registered.

- [x] **Step 4: Implement payment module and registry update**

```ts
import { defineModule } from '~/core/module-registry'
import { createPrepayOrder } from './shared/services/create-prepay-order.service'
import { closePaymentOrder, queryPaymentOrderStatus, syncPaymentOrderStatus } from './shared/services/payment-order-status.service'

export const paymentModule = defineModule({
  key: 'payment',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      createPrepayOrder,
      queryPaymentOrderStatus,
      syncPaymentOrderStatus,
      closePaymentOrder,
    },
    events: {
      orderPaid: 'payment.order.paid',
      orderClosed: 'payment.order.closed',
      orderFailed: 'payment.order.failed',
    },
  },
})
```

Update `src/modules/index.ts` to pass `[authModule, paymentModule] as const` to `createModuleRegistry`.

- [x] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/modules/events.test.ts src/modules/payment/module.test.ts src/modules/index.test.ts`

Expected: PASS.

### Task 3: Final Verification

**Files:**
- Verify only.

- [x] **Step 1: Run focused module and payment tests**

Run:

```powershell
pnpm vitest run src/modules/events.test.ts src/modules/index.test.ts src/modules/payment/module.test.ts src/modules/payment/shared/services/create-prepay-order.service.test.ts src/modules/payment/shared/services/payment-order-status.service.test.ts
```

Expected: PASS.

- [x] **Step 2: Run typecheck if practical**

Run: `pnpm run typecheck`

Expected: May fail because this repo has known unrelated TypeScript errors; report exact result instead of claiming repo-wide type health.
