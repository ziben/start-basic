import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { toggleNavItemVisibility } from './index'
import { withAdminAuth } from '../../../../middleware'

// 导航项可见性API路由
export const ServerRoute = createServerFileRoute('/api/admin/navitem/visibility').methods({
  // 更新导航项可见性
  PUT: withAdminAuth(async ({ request }: any) => {
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
