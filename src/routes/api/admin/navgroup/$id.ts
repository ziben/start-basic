import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { withAdminAuth } from '../../../../middleware'
import { getNavGroupById, updateNavGroup, deleteNavGroup } from './index'

// 创建单个导航组API路由
export const Route = createFileRoute('/api/admin/navgroup/$id')({
  server: {
    handlers: {
      // 获取单个导航组
      GET: withAdminAuth(async ({ params }: any) => {
        const { id } = params
        if (!id) {
          return new Response('ID不能为空', { status: 400 })
        }

        const group = await getNavGroupById(id)
        return Response.json(group)
      }),

      // 更新导航组
      PUT: withAdminAuth(async ({ request, params }: any) => {
        try {
          const { id } = params
          if (!id) {
            return new Response('ID不能为空', { status: 400 })
          }

          const body = await request.json()
          const updateSchema = z.object({
            title: z.string().optional(),
            scope: z.enum(['APP', 'ADMIN']).optional(),
            description: z.string().optional(),
            icon: z.string().optional(),
            orderIndex: z.number().optional(),
            isVisible: z.boolean().optional(),
          })

          const data = updateSchema.parse(body)
          const result = await updateNavGroup(id, data)
          return Response.json(result)
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),

      // 删除导航组
      DELETE: withAdminAuth(async ({ params }: any) => {
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
      }),
    },
  },
})
