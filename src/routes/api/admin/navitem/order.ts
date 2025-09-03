import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { updateNavItemOrder } from './index'
import { withAdminAuth } from '../../../../middleware'

// 导航项顺序API路由
export const ServerRoute = createServerFileRoute('/api/admin/navitem/order').methods({
  // 更新导航项顺序
  PUT: withAdminAuth(async ({ request }) => {
    try {
      const body = await request.json()
      const orderSchema = z.object({
        itemIds: z.array(z.string())
      })
      
      const data = orderSchema.parse(body)
      const result = await updateNavItemOrder(data.itemIds)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
