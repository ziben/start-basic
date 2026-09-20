/**
 * Payment Order ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/payment-order.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
// ============ 认证辅助函数 ============

import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

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

// ============ ServerFn 定义 ============

/**
 * 获取订单列表（分页）
 */
export const getPaymentOrdersFn = createServerFn({ method: 'GET' })
  .validator(ListPaymentOrdersSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListPaymentOrdersSchema> }) => {
    await requireAdmin('ListPaymentOrders')
    const { PaymentOrderAdminService } = await import('../services/payment-order-admin.service')
    return PaymentOrderAdminService.getList(data)
  })

/**
 * 获取单个订单
 */
export const getPaymentOrderFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('GetPaymentOrderDetail')
    const { PaymentOrderAdminService } = await import('../services/payment-order-admin.service')
    return PaymentOrderAdminService.getById(data.id)
  })

/**
 * 获取订单统计
 */
export const getPaymentOrderStatsFn = createServerFn({ method: 'GET' })
  .validator(z.object({}).optional())
  .handler(async () => {
    await requireAdmin('GetPaymentOrderStats')
    const { PaymentOrderAdminService } = await import('../services/payment-order-admin.service')
    return PaymentOrderAdminService.getStats()
  })

/**
 * 更新订单状态
 */
export const updatePaymentOrderStatusFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdatePaymentOrderStatusSchema>) => UpdatePaymentOrderStatusSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdatePaymentOrderStatusSchema> }) => {
    await requireAdmin('UpdatePaymentOrderStatus')
    const { PaymentOrderAdminService } = await import('../services/payment-order-admin.service')
    const { id, ...updateData } = data
    return PaymentOrderAdminService.updateStatus(id, updateData)
  })

/**
 * 更新订单信息
 */
export const updatePaymentOrderFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdatePaymentOrderSchema>) => UpdatePaymentOrderSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdatePaymentOrderSchema> }) => {
    await requireAdmin('UpdatePaymentOrder')
    const { PaymentOrderAdminService } = await import('../services/payment-order-admin.service')
    const { id, ...updateData } = data
    return PaymentOrderAdminService.update(id, updateData)
  })
