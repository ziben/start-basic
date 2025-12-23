import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/lib/admin-utils'

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  banned: z.boolean(),
  banReason: z.string().nullable().optional(),
  banExpires: z.string().datetime().nullable().optional(),
})

export const Route = createFileRoute('/api/admin/user/bulk-ban' as any)({
  server: {
    handlers: {
      POST: withAdminAuth(async ({ request }) => {
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

          return Response.json({ count: result.count })
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
