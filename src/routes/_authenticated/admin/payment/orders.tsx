import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { PaymentOrdersPage } from '~/modules/payment/admin'

// 扩展通用表格搜索参数，添加 payment 特有的筛选字段
const paymentOrdersSearchSchema = tableSearchSchema.extend({
  status: z.string().optional().catch(undefined),
  paymentMethod: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/admin/payment/orders')({
  validateSearch: paymentOrdersSearchSchema,
  component: PaymentOrdersPage,
})
