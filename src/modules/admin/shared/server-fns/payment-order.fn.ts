/**
 * Payment Order ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListPaymentOrdersSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CLOSED']).optional(),
    paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5', 'ALIPAY']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

const UpdatePaymentOrderStatusSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CLOSED']),
    note: z.string().optional(),
})

const UpdatePaymentOrderSchema = z.object({
    id: z.string().min(1),
    description: z.string().optional(),
    metadata: z.any().optional(),
})

// ============ 认证辅助函数 ============

import { requireAdmin } from './auth'

// ============ ServerFn 定义 ============

/**
 * 获取订单列表（分页）
 */
export const getPaymentOrdersFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListPaymentOrdersSchema>) => (data ? ListPaymentOrdersSchema.parse(data) : {}))
    .handler(async ({ data }: { data: z.infer<typeof ListPaymentOrdersSchema> }) => {
        await requireAdmin('ListPaymentOrders')
        const { PaymentOrderService } = await import('../services/payment-order.service')
        return PaymentOrderService.getList(data)
    })

/**
 * 获取单个订单
 */
export const getPaymentOrderFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('订单ID不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('GetPaymentOrderDetail')
        const { PaymentOrderService } = await import('../services/payment-order.service')
        return PaymentOrderService.getById(data.id)
    })

/**
 * 获取订单统计
 */
export const getPaymentOrderStatsFn = createServerFn({ method: 'GET' })
    .inputValidator(() => ({}))
    .handler(async () => {
        await requireAdmin('GetPaymentOrderStats')
        const { PaymentOrderService } = await import('../services/payment-order.service')
        return PaymentOrderService.getStats()
    })

/**
 * 更新订单状态
 */
export const updatePaymentOrderStatusFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdatePaymentOrderStatusSchema>) =>
        UpdatePaymentOrderStatusSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof UpdatePaymentOrderStatusSchema> }) => {
        await requireAdmin('UpdatePaymentOrderStatus')
        const { PaymentOrderService } = await import('../services/payment-order.service')
        const { id, ...updateData } = data
        return PaymentOrderService.updateStatus(id, updateData)
    })

/**
 * 更新订单信息
 */
export const updatePaymentOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdatePaymentOrderSchema>) => UpdatePaymentOrderSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdatePaymentOrderSchema> }) => {
        await requireAdmin('UpdatePaymentOrder')
        const { PaymentOrderService } = await import('../services/payment-order.service')
        const { id, ...updateData } = data
        return PaymentOrderService.update(id, updateData)
    })
