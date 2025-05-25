import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import { updateNavItemOrder } from './controller'
import { withAdminAuth } from '../middleware'

// 导航项顺序API路由
export const APIRoute = createAPIFileRoute('/api/admin/navitem/order')({
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
