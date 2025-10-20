import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { withAdminAuth } from '../../../../middleware'
import prisma from '~/lib/db'

export const Route = createFileRoute('/api/admin/translation/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }: any) => {
        const qs = new URL(request.url).searchParams
        const locale = qs.get('locale') || undefined

        const where: any = {}
        if (locale) where.locale = locale

        const items = await prisma.translation.findMany({ where, orderBy: { key: 'asc' } })
        return Response.json(items)
      }),

      POST: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const schema = z.object({ locale: z.string(), key: z.string(), value: z.string() })
          const data = schema.parse(body)

          const created = await prisma.translation.create({ data })
          return Response.json(created)
        } catch (err) {
          return new Response(String(err), { status: 400 })
        }
      }),
    }
  }
})
