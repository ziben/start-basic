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
