import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { updateUserNavGroupVisibility } from './index'
import { withAdminAuth } from '../../../../middleware'

// 导航组可见性API路由
export const Route = createFileRoute('/api/admin/navgroup/visibility')({
  server: {
    handlers: {
      // 更新导航组可见性
      PUT: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const visibilitySchema = z.object({
            userId: z.string(),
            navGroupId: z.string(),
            isVisible: z.boolean()
          })

          const data = visibilitySchema.parse(body)
          const result = await updateUserNavGroupVisibility(
            data.userId,
            data.navGroupId,
            data.isVisible
          )
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      })
    }
  }
})
