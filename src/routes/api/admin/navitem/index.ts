import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import {
  getAllNavItems,
  createNavItem
} from './controller'
import { withAdminAuth } from '../middleware'

// 创建导航项API路由
export const APIRoute = createAPIFileRoute('/api/admin/navitem')({
  // 获取所有导航项
  GET: withAdminAuth(async ({ request }) => {
    const url = new URL(request.url)
    const navGroupId = url.searchParams.get('navGroupId')
    
    // 获取所有导航项
    const items = await getAllNavItems(navGroupId ?? undefined)
    return Response.json(items)
  }),
  
  // 创建导航项
  POST: withAdminAuth(async ({ request }) => {
    try {
      const body = await request.json()
      const createSchema = z.object({
        title: z.string(),
        url: z.string().optional(),
        icon: z.string().optional(),
        badge: z.string().optional(),
        isCollapsible: z.boolean().optional(),
        navGroupId: z.string(),
        parentId: z.string().optional(),
        orderIndex: z.number().optional()
      })
      
      const data = createSchema.parse(body)
      const result = await createNavItem(data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
