import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/lib/admin-utils'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

export const Route = createFileRoute('/api/admin/user/bulk-delete' as any)({
  server: {
    handlers: {
      POST: withAdminAuth(async (ctx) => {
        const { request } = ctx
        try {
          const body = await request.json()
          const data = bodySchema.parse(body)

          const result = await prisma.user.deleteMany({
            where: { id: { in: data.ids } },
          })

          void ctx.audit.log({
            action: 'user.bulk_delete',
            targetType: 'user',
            targetId: null,
            success: true,
            message: '批量删除用户',
            meta: {
              ids: data.ids,
              count: result.count,
            },
          })

          return Response.json({ count: result.count })
        } catch (error) {
          void ctx.audit.log({
            action: 'user.bulk_delete',
            targetType: 'user',
            targetId: null,
            success: false,
            message: '批量删除用户失败',
            meta: { error: String(error) },
          })
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
