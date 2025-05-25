import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import { toggleNavItemVisibility } from './controller'
import { withAdminAuth } from '../middleware'

// 导航项可见性API路由
export const APIRoute = createAPIFileRoute('/api/admin/navitem/visibility')({
  // 更新导航项可见性
  PUT: withAdminAuth(async ({ request }) => {
    try {
      const body = await request.json()
      const visibilitySchema = z.object({
        id: z.string(),
        isVisible: z.boolean()
      })
      
      const data = visibilitySchema.parse(body)
      const result = await toggleNavItemVisibility(
        data.id,
        data.isVisible
      )
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
