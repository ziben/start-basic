import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { updateNavGroupOrder } from './index'
import { withAdminAuth } from '../../../../middleware'

// 导航组顺序API路由
export const ServerRoute = createServerFileRoute('/api/admin/navgroup/order').methods({
  // 更新导航组顺序
  PUT: withAdminAuth(async ({ request }: any) => {
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
