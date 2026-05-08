import { createEventBus, type EventBus } from '~/core/event-bus'

export type AppEvents = {
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
  'payment.order.closed': {
    orderId: string
    userId: string
    outTradeNo: string
    closedAt: Date
  }
  'payment.order.failed': {
    orderId: string
    userId?: string
    outTradeNo?: string
    reason?: string
    failedAt: Date
  }
}

export type AppEventBus = EventBus<AppEvents>

export function createAppEventBus(): AppEventBus {
  return createEventBus<AppEvents>()
}

export const appEventBus = createAppEventBus()
