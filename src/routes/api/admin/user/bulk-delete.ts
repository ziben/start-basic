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
      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const data = bodySchema.parse(body)

          const result = await prisma.user.deleteMany({
            where: { id: { in: data.ids } },
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
