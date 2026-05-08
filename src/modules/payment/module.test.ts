import { describe, expect, it } from 'vitest'
import { paymentModule } from './module'
import { createPrepayOrder } from './shared/services/create-prepay-order.service'
import {
  closePaymentOrder,
  queryPaymentOrderStatus,
  syncPaymentOrderStatus,
} from './shared/services/payment-order-status.service'

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
