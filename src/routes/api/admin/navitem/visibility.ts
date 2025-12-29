import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { withAdminAuth } from '../../../../middleware'
import { toggleNavItemVisibility } from './index'

// 导航项可见性API路由
export const Route = createFileRoute('/api/admin/navitem/visibility')({
  server: {
    handlers: {
      // 更新导航项可见性
      PUT: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const visibilitySchema = z.object({
            id: z.string(),
            isVisible: z.boolean(),
          })

          const data = visibilitySchema.parse(body)
          const result = await toggleNavItemVisibility(data.id, data.isVisible)
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})

