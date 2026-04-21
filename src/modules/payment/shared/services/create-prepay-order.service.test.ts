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
