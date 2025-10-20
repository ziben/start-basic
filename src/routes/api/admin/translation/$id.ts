import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { withAdminAuth } from '~/middleware'
import prisma from '~/lib/db'

export const Route = createFileRoute('/api/admin/translation/$id')({
  server: {
    handlers: {
      PUT: withAdminAuth(async ({ params, request }: any) => {
        try {
          const { id } = params
          const body = await request.json()
          const schema = z.object({ value: z.string().optional() })
          const data = schema.parse(body)

          const updated = await prisma.translation.update({ where: { id }, data })
          return Response.json(updated)
        } catch (err) {
          return new Response(String(err), { status: 400 })
        }
      }),

      DELETE: withAdminAuth(async ({ params }: any) => {
        const { id } = params
        await prisma.translation.delete({ where: { id } })
        return Response.json({ success: true })
      }),
    }
  }
})
