import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/member/batch')({
  server: {
    handlers: {
      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const schema = z.object({
            ids: z.array(z.string().min(1)).min(1),
          })
          const input = schema.parse(body)

          const result = await prisma.member.deleteMany({
            where: { id: { in: input.ids } },
          })

          return Response.json({ count: result.count })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
