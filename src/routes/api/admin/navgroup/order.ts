import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import { updateNavGroupOrder } from './controller'
import { withAdminAuth } from '../middleware'

// 导航组顺序API路由
export const APIRoute = createAPIFileRoute('/api/admin/navgroup/order')({
  // 更新导航组顺序
  PUT: withAdminAuth(async ({ request }) => {
    try {
      const body = await request.json()
      const orderSchema = z.object({
        groupIds: z.array(z.string())
      })
      
      const data = orderSchema.parse(body)
      const result = await updateNavGroupOrder(data.groupIds)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
