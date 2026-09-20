import { ServiceError } from '~/shared/utils/service-error'
import type { PaymentResult } from '../lib/wechat-pay'

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CLOSED'

type PaymentOrder = {
  id: string
  userId: string
  outTradeNo: string
  transactionId: string | null
  amount: number
  status: PaymentStatus
  description: string
  paymentMethod: string
  createdAt: Date
  paidAt: Date | null
}

export type PaymentOrderStatusResult = Omit<PaymentOrder, 'userId'>
export type SyncPaymentOrderStatusResult =
  | { status: 'SUCCESS'; transactionId: string | undefined }
  | { status: 'REFUNDED'; transactionId: string | null }
  | { status: 'FAILED'; message: string | undefined }
  | { status: 'PENDING'; message: string | undefined }
  | { status: 'UNKNOWN'; message: string }
export type ClosePaymentOrderResult = { success: true }

export type QueryPaymentOrderPrisma = {
  paymentOrder: {
    findUnique(args: unknown): Promise<PaymentOrder | null>
  }
}

export type MutatePaymentOrderPrisma = {
  paymentOrder: QueryPaymentOrderPrisma['paymentOrder'] & {
    update(args: unknown): Promise<unknown>
  }
}

export type WeChatStatusGateway = {
  queryOrderByOutTradeNo(outTradeNo: string): Promise<Partial<PaymentResult>>
}

export type WeChatCloseGateway = {
  closeOrder(outTradeNo: string): Promise<void>
}

function assertSession(sessionUserId: string | null): asserts sessionUserId is string {
  if (!sessionUserId) {
    throw new ServiceError('UNAUTHORIZED', 'Unauthorized')
  }
}

function assertOwnedOrder(order: PaymentOrder | null, sessionUserId: string): PaymentOrder {
  if (!order) {
    throw new ServiceError('NOT_FOUND', 'Order not found')
  }

  if (order.userId !== sessionUserId) {
    throw new ServiceError('FORBIDDEN', 'Forbidden')
  }

  return order
}

function stripUserId(order: PaymentOrder): PaymentOrderStatusResult {
  const { userId: _, ...orderWithoutUserId } = order
  return orderWithoutUserId
}

async function findOwnedOrder(
  prisma: QueryPaymentOrderPrisma,
  orderId: string,
  sessionUserId: string
): Promise<PaymentOrder> {
  const order = await prisma.paymentOrder.findUnique({
    where: { id: orderId },
  })
  return assertOwnedOrder(order, sessionUserId)
}

export async function queryPaymentOrderStatus(options: {
  orderId: string
  sessionUserId: string | null
  prisma: QueryPaymentOrderPrisma
}): Promise<PaymentOrderStatusResult> {
  assertSession(options.sessionUserId)

  const order = await options.prisma.paymentOrder.findUnique({
    where: { id: options.orderId },
    select: {
      id: true,
      userId: true,
      outTradeNo: true,
      transactionId: true,
      amount: true,
      status: true,
      description: true,
      paymentMethod: true,
      createdAt: true,
      paidAt: true,
    },
  })

  return stripUserId(assertOwnedOrder(order, options.sessionUserId))
}

export async function syncPaymentOrderStatus(options: {
  orderId: string
  sessionUserId: string | null
  prisma: MutatePaymentOrderPrisma
  wechatPayClient: WeChatStatusGateway
  onPaymentSuccess: (orderId: string, result: Partial<PaymentResult>) => Promise<void>
}): Promise<SyncPaymentOrderStatusResult> {
  assertSession(options.sessionUserId)
  const order = await findOwnedOrder(options.prisma, options.orderId, options.sessionUserId)

  if (order.status === 'SUCCESS') {
    return { status: 'SUCCESS', transactionId: order.transactionId ?? undefined }
  }

  if (order.status === 'REFUNDED') {
    return { status: 'REFUNDED', transactionId: order.transactionId }
  }

  try {
    const result = await options.wechatPayClient.queryOrderByOutTradeNo(order.outTradeNo)

    if (result.trade_state === 'SUCCESS') {
      await options.prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: 'SUCCESS',
          transactionId: result.transaction_id,
          paidAt: new Date(result.success_time ?? Date.now()),
        },
      })

      await options.onPaymentSuccess(order.id, result)
      return { status: 'SUCCESS', transactionId: result.transaction_id }
    }

    if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(result.trade_state ?? '')) {
      await options.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })
      return { status: 'FAILED', message: result.trade_state_desc }
    }

    return { status: 'PENDING', message: result.trade_state_desc }
  } catch (error) {
    console.error('[WeChatPay] Query order failed:', error)
    return { status: 'UNKNOWN', message: 'Failed to query order status' }
  }
}

export async function closePaymentOrder(options: {
  orderId: string
  sessionUserId: string | null
  prisma: MutatePaymentOrderPrisma
  wechatPayClient: WeChatCloseGateway
}): Promise<ClosePaymentOrderResult> {
  assertSession(options.sessionUserId)
  const order = await findOwnedOrder(options.prisma, options.orderId, options.sessionUserId)

  if (order.status !== 'PENDING') {
    throw new Error('Only pending orders can be closed')
  }

  try {
    await options.wechatPayClient.closeOrder(order.outTradeNo)
    await options.prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: 'CLOSED' },
    })
    return { success: true }
  } catch (error) {
    console.error('[WeChatPay] Close order failed:', error)
    throw new Error('Failed to close order')
  }
}
