import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/modules/system-admin/shared/utils/admin-utils'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  banned: z.boolean(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().datetime().nullable().optional(),
})

export const Route = createFileRoute('/api/admin/user/bulk-ban' as any)({
  server: {
    handlers: {
      POST: withAdminAuth(async (ctx) => {
        const { request } = ctx
        try {
          const body = await request.json()
          const data = bodySchema.parse(body)

          const updateData = data.banned
            ? {
                banned: true,
                banReason: data.banReason ?? null,
                banExpires: data.banExpires ? new Date(data.banExpires) : null,
              }
            : {
                banned: false,
                banReason: null,
                banExpires: null,
              }

          const result = await prisma.user.updateMany({
            where: { id: { in: data.ids } },
            data: updateData,
          })

          void ctx.audit.log({
            action: data.banned ? 'user.bulk_ban' : 'user.bulk_unban',
            targetType: 'user',
            targetId: null,
            success: true,
            message: data.banned ? '批量封禁用户' : '批量解封用户',
            meta: {
              ids: data.ids,
              count: result.count,
              banReason: data.banReason ?? null,
              banExpires: data.banExpires ?? null,
            },
          })

          return Response.json({ count: result.count })
        } catch (error) {
          void ctx.audit.log({
            action: 'user.bulk_ban',
            targetType: 'user',
            targetId: null,
            success: false,
            message: '批量封禁/解封失败',
            meta: { error: String(error) },
          })
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})




