import { createAPIFileRoute } from '@tanstack/react-start/api'
import { z } from 'zod'
import {
  getNavItemById,
  updateNavItem,
  deleteNavItem
} from './controller'
import { withAdminAuth } from '../middleware'

// 创建单个导航项API路由
export const APIRoute = createAPIFileRoute('/api/admin/navitem/$id')({
  // 获取单个导航项
  GET: withAdminAuth(async ({ params }) => {
    const { id } = params
    if (!id) {
      return new Response('ID不能为空', { status: 400 })
    }
    
    const item = await getNavItemById(id)
    return Response.json(item)
  }),
  
  // 更新导航项
  PUT: withAdminAuth(async ({ request, params }) => {
    try {
      const { id } = params
      if (!id) {
        return new Response('ID不能为空', { status: 400 })
      }
      
      const body = await request.json()
      const updateSchema = z.object({
        title: z.string().optional(),
        url: z.string().optional(),
        icon: z.string().optional(),
        badge: z.string().optional(),
        isCollapsible: z.boolean().optional(),
        navGroupId: z.string().optional(),
        parentId: z.string().optional(),
        orderIndex: z.number().optional()
      })
      
      const data = updateSchema.parse(body)
      const result = await updateNavItem(id, data)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  }),
  
  // 删除导航项
  DELETE: withAdminAuth(async ({ params }) => {
    try {
      const { id } = params
      if (!id) {
        return new Response('ID不能为空', { status: 400 })
      }
      
      const result = await deleteNavItem(id)
      return Response.json(result)
    } catch (error) {
      return new Response(String(error), { status: 400 })
    }
  })
})
