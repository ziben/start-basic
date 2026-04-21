import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getDb = vi.fn()
const getWeChatPayClient = vi.fn()
const createPrepayOrder = vi.fn()

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

describe('handleCreatePrepayOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.WECHAT_PAY_NOTIFY_URL = 'https://example.com/api/payment/wechat/notify'
  })

  it('delegates to createPrepayOrder with session, prisma and gateway', async () => {
    getSession.mockResolvedValue({ user: { id: 'user_1' } })
    getDb.mockResolvedValue({ paymentOrder: {}, account: {} })
    getWeChatPayClient.mockResolvedValue({ transactionsNative: vi.fn(), transactionsJSAPI: vi.fn() })
    createPrepayOrder.mockResolvedValue({ orderId: 'order_1', outTradeNo: 'trade_1', codeUrl: 'weixin://code' })

    const { handleCreatePrepayOrder } = await import('./prepay')

    const result = await handleCreatePrepayOrder(
      {
        amount: 100,
        description: 'VIP 会员',
        paymentMethod: 'WECHAT_NATIVE',
      },
      new Headers([['cookie', 'sid=test']]),
    )

    expect(createPrepayOrder).toHaveBeenCalledWith(
      {
        amount: 100,
        description: 'VIP 会员',
        paymentMethod: 'WECHAT_NATIVE',
      },
      expect.objectContaining({
        sessionUserId: 'user_1',
        notifyUrl: 'https://example.com/api/payment/wechat/notify',
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
