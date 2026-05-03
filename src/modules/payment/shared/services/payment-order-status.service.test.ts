import { describe, expect, it, vi } from 'vitest'
import {
  closePaymentOrder,
  queryPaymentOrderStatus,
  syncPaymentOrderStatus,
} from './payment-order-status.service'

const baseOrder = {
  id: 'order_1',
  userId: 'user_1',
  outTradeNo: 'trade_1',
  transactionId: null,
  amount: 100,
  status: 'PENDING' as const,
  description: 'VIP 会员',
  paymentMethod: 'WECHAT_NATIVE' as const,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  paidAt: null,
}

describe('payment order status service', () => {
  it('returns an owned order without leaking userId', async () => {
    const result = await queryPaymentOrderStatus({
      orderId: 'order_1',
      sessionUserId: 'user_1',
      prisma: {
        paymentOrder: {
          findUnique: vi.fn().mockResolvedValue(baseOrder),
        },
      },
    })

    expect(result).toEqual({
      id: 'order_1',
      outTradeNo: 'trade_1',
      transactionId: null,
      amount: 100,
      status: 'PENDING',
      description: 'VIP 会员',
      paymentMethod: 'WECHAT_NATIVE',
      createdAt: baseOrder.createdAt,
      paidAt: null,
    })
  })

  it('rejects access to another user order', async () => {
    await expect(
      queryPaymentOrderStatus({
        orderId: 'order_1',
        sessionUserId: 'user_2',
        prisma: {
          paymentOrder: {
            findUnique: vi.fn().mockResolvedValue(baseOrder),
          },
        },
      }),
    ).rejects.toThrow('Forbidden')
  })

  it('syncs a successful WeChat payment and fires the success hook', async () => {
    const update = vi.fn().mockResolvedValue({})
    const onPaymentSuccess = vi.fn().mockResolvedValue(undefined)

    const result = await syncPaymentOrderStatus({
      orderId: 'order_1',
      sessionUserId: 'user_1',
      prisma: {
        paymentOrder: {
          findUnique: vi.fn().mockResolvedValue(baseOrder),
          update,
        },
      },
      wechatPayClient: {
        queryOrderByOutTradeNo: vi.fn().mockResolvedValue({
          trade_state: 'SUCCESS',
          trade_state_desc: '支付成功',
          transaction_id: 'tx_1',
          success_time: '2026-01-01T01:00:00.000Z',
        }),
      },
      onPaymentSuccess,
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: {
        status: 'SUCCESS',
        transactionId: 'tx_1',
        paidAt: new Date('2026-01-01T01:00:00.000Z'),
      },
    })
    expect(onPaymentSuccess).toHaveBeenCalledWith('order_1', expect.objectContaining({
      transaction_id: 'tx_1',
    }))
    expect(result).toEqual({ status: 'SUCCESS', transactionId: 'tx_1' })
  })

  it('closes a pending order locally after closing the WeChat order', async () => {
    const closeOrder = vi.fn().mockResolvedValue(undefined)
    const update = vi.fn().mockResolvedValue({})

    const result = await closePaymentOrder({
      orderId: 'order_1',
      sessionUserId: 'user_1',
      prisma: {
        paymentOrder: {
          findUnique: vi.fn().mockResolvedValue(baseOrder),
          update,
        },
      },
      wechatPayClient: { closeOrder },
    })

    expect(closeOrder).toHaveBeenCalledWith('trade_1')
    expect(update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'CLOSED' },
    })
    expect(result).toEqual({ success: true })
  })
})
