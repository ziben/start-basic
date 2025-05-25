import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import {
  getNavGroupById,
  updateNavGroup,
  deleteNavGroup
} from './controller'
import { withAdminAuth } from '../middleware'

// 创建单个导航组API路由
export const APIRoute = createAPIFileRoute('/api/admin/navgroup/$id')({
  // 获取单个导航组
  GET: withAdminAuth(async ({ params }) => {
    const { id } = params
    if (!id) {
      return new Response('ID不能为空', { status: 400 })
    }
    
    const group = await getNavGroupById(id)
    return Response.json(group)
  }),
  
  // 更新导航组
  PUT: withAdminAuth(async ({ request, params }) => {
    try {
      const { id } = params
      if (!id) {
        return new Response('ID不能为空', { status: 400 })
      }
      
      const body = await request.json()
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        orderIndex: z.number().optional(),
        isVisible: z.boolean().optional()
      })
      
      const data = updateSchema.parse(body)
      const result = await updateNavGroup(id, data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  }),
  
  // 删除导航组
  DELETE: withAdminAuth(async ({ params }) => {
    try {
      const { id } = params
      if (!id) {
        return new Response('ID不能为空', { status: 400 })
      }
      
      const result = await deleteNavGroup(id)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
