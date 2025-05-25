import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import { updateUserNavGroupVisibility } from './controller'
import { withAdminAuth } from '../middleware'

// 导航组可见性API路由
export const APIRoute = createAPIFileRoute('/api/admin/navgroup/visibility')({
  // 更新导航组可见性
  PUT: withAdminAuth(async ({ request }) => {
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
})
