import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { withAdminAuth } from '../../../../middleware'
import { updateNavItemOrder } from './index'

// 导航项顺序API路由
export const Route = createFileRoute('/api/admin/navitem/order')({
  server: {
    handlers: {
      // 更新导航项顺序
      PUT: withAdminAuth(async ({ request }: any) => {
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
    }
  }
})
