import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import {
  getAllNavGroups,
  createNavGroup
} from './controller'
import { withAdminAuth } from '../middleware'

// 创建导航组API路由
export const APIRoute = createAPIFileRoute('/api/admin/navgroup')({
  // 获取导航组
  GET: withAdminAuth(async ({ request }) => {
    // 获取所有导航组
    const groups = await getAllNavGroups()
    return Response.json(groups)
  }),
  
  // 创建导航组
  POST: withAdminAuth(async ({ request }) => {
    try {
      const body = await request.json()
      const createSchema = z.object({
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        orderIndex: z.number().optional(),
        isVisible: z.boolean().optional()
      })
      
      const data = createSchema.parse(body)
      const result = await createNavGroup(data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
