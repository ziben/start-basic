export const PAYMENT_ORDER_SORT_FIELDS = ['createdAt', 'updatedAt', 'amount', 'paidAt', 'status'] as const

export type PaymentOrderSortField = (typeof PAYMENT_ORDER_SORT_FIELDS)[number]

export type AdminPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CLOSED'

export type AdminPaymentMethod = 'WECHAT_JSAPI' | 'WECHAT_NATIVE' | 'WECHAT_H5' | 'ALIPAY'

export type PrismaPaymentOrderForAdmin = {
  id: string
  userId: string
  outTradeNo: string
  transactionId: string | null
  amount: number
  status: AdminPaymentStatus
  description: string
  paymentMethod: AdminPaymentMethod
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
  metadata: unknown
  user?: {
    id: string
    name: string
    email: string
    image: string | null
    username?: string | null
  }
}

export type SerializedPaymentOrderForAdmin = {
  id: string
  userId: string
  outTradeNo: string
  transactionId: string | null
  amount: number
  amountYuan: string
  status: AdminPaymentStatus
  description: string
  paymentMethod: AdminPaymentMethod
  createdAt: string
  updatedAt: string
  paidAt: string | null
  metadata: Record<string, string | number | boolean | object> | null
  user?: {
    id: string
    name: string
    email: string
    image: string | null
    username: string | null
  }
}

export function isValidPaymentOrderSortField(value: string): value is PaymentOrderSortField {
  return PAYMENT_ORDER_SORT_FIELDS.includes(value as PaymentOrderSortField)
}

export function serializePaymentOrderForAdmin(order: PrismaPaymentOrderForAdmin): SerializedPaymentOrderForAdmin {
  return {
    id: order.id,
    userId: order.userId,
    outTradeNo: order.outTradeNo,
    transactionId: order.transactionId,
    amount: order.amount,
    amountYuan: (order.amount / 100).toFixed(2),
    status: order.status,
    description: order.description,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    metadata: normalizePaymentOrderMetadata(order.metadata),
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          image: order.user.image,
          username: order.user.username ?? null,
        }
      : undefined,
  }
}

export function serializePaymentOrdersForAdmin(orders: PrismaPaymentOrderForAdmin[]): SerializedPaymentOrderForAdmin[] {
  return orders.map(serializePaymentOrderForAdmin)
}

function normalizePaymentOrderMetadata(metadata: unknown): Record<string, string | number | boolean | object> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  return metadata as Record<string, string | number | boolean | object>
}
