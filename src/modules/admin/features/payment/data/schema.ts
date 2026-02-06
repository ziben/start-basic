import { z } from 'zod'

// 支付状态枚举
export const paymentStatuses = [
    { labelKey: 'admin.payment.status.pending', value: 'PENDING' },
    { labelKey: 'admin.payment.status.success', value: 'SUCCESS' },
    { labelKey: 'admin.payment.status.failed', value: 'FAILED' },
    { labelKey: 'admin.payment.status.refunded', value: 'REFUNDED' },
    { labelKey: 'admin.payment.status.closed', value: 'CLOSED' },
] as const

// 支付方式枚举
export const paymentMethods = [
    { labelKey: 'admin.payment.method.wechat_jsapi', value: 'WECHAT_JSAPI' },
    { labelKey: 'admin.payment.method.wechat_native', value: 'WECHAT_NATIVE' },
    { labelKey: 'admin.payment.method.wechat_h5', value: 'WECHAT_H5' },
    { labelKey: 'admin.payment.method.alipay', value: 'ALIPAY' },
] as const

// 订单Schema定义
export const paymentOrderSchema = z.object({
    id: z.string(),
    userId: z.string(),
    outTradeNo: z.string(),
    transactionId: z.string().nullable(),
    amount: z.number(),
    amountYuan: z.string(), // 金额（元）
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CLOSED']),
    description: z.string(),
    paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5', 'ALIPAY']),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    paidAt: z.string().or(z.date()).nullable(),
    metadata: z.unknown().optional(),
    user: z
        .object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            username: z.string().nullable(),
        })
        .optional(),
})

export const paymentOrderListSchema = z.array(paymentOrderSchema)

export const paymentOrderPageSchema = z.object({
    items: paymentOrderListSchema,
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    pageCount: z.number().int().nonnegative(),
})

export type PaymentOrder = z.infer<typeof paymentOrderSchema>
export type PaymentOrderList = z.infer<typeof paymentOrderListSchema>
export type PaymentOrderPageData = z.infer<typeof paymentOrderPageSchema>
