import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { withAdminAuth } from '../../../../middleware'
import { getNavItemById, updateNavItem, deleteNavItem } from './index'

// 创建单个导航项API路由
export const Route = createFileRoute('/api/admin/navitem/$id')({
  server: {
    handlers: {
      // 获取单个导航项
      GET: withAdminAuth(async ({ params }: any) => {
        const { id } = params
        if (!id) {
          return new Response('ID不能为空', { status: 400 })
        }

        const item = await getNavItemById(id)
        return Response.json(item)
      }),

      // 更新导航项
      PUT: withAdminAuth(async ({ request, params }: any) => {
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
            orderIndex: z.number().optional(),
          })

          const data = updateSchema.parse(body)
          const result = await updateNavItem(id, data)
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),

      // 删除导航项
      DELETE: withAdminAuth(async ({ params }: any) => {
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
      }),
    },
  },
})

