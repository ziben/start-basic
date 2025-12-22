import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/session/$id' as any)({
  server: {
    handlers: {
      DELETE: withAdminAuth(async ({ params }: any) => {
        try {
          const { id } = params as { id?: string }
          if (!id) return new Response('ID不能为空', { status: 400 })

          await prisma.session.delete({ where: { id } })
          return Response.json({ success: true, id })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
