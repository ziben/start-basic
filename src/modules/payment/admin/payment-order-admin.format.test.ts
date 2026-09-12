import { describe, expect, it } from 'vitest'
import { isValidPaymentOrderSortField, serializePaymentOrderForAdmin } from './payment-order-admin.format'

describe('payment order admin formatter', () => {
  it('serializes admin payment orders without importing admin feature code', () => {
    const serialized = serializePaymentOrderForAdmin({
      id: 'order_1',
      userId: 'user_1',
      outTradeNo: 'trade_1',
      transactionId: null,
      amount: 1299,
      status: 'SUCCESS',
      description: 'membership',
      paymentMethod: 'WECHAT_NATIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T01:00:00.000Z'),
      paidAt: new Date('2026-01-01T00:30:00.000Z'),
      metadata: { channel: 'admin' },
      user: {
        id: 'user_1',
        name: 'Admin',
        email: 'admin@example.com',
        image: null,
      },
    })

    expect(serialized).toEqual(
      expect.objectContaining({
        amountYuan: '12.99',
        paidAt: '2026-01-01T00:30:00.000Z',
        metadata: { channel: 'admin' },
        user: expect.objectContaining({ username: null }),
      })
    )
  })

  it('keeps payment order sort fields explicit', () => {
    expect(isValidPaymentOrderSortField('createdAt')).toBe(true)
    expect(isValidPaymentOrderSortField('outTradeNo')).toBe(false)
  })
})
