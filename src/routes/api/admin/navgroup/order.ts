import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { withAdminAuth } from '../../../../middleware'
import { updateNavGroupOrder } from './index'

// 导航组顺序API路由
export const Route = createFileRoute('/api/admin/navgroup/order')({
  server: {
    handlers: {
      // 更新导航组顺序
      PUT: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const orderSchema = z.object({
            groupIds: z.array(z.string()),
          })

          const data = orderSchema.parse(body)
          const result = await updateNavGroupOrder(data.groupIds)
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})

