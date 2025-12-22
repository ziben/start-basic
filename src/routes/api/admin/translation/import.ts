import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/translation/import')({
  server: {
    handlers: {
      POST: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          if (!Array.isArray(body)) return new Response('Expected array', { status: 400 })

          const results = { inserted: 0, updated: 0 }
          for (const item of body) {
            const { locale, key, value } = item as any
            const existing = await prisma.translation
              .findUnique({ where: { locale_key: { locale, key } as any } })
              .catch(() => null)
            if (existing) {
              await prisma.translation.update({ where: { id: existing.id }, data: { value } })
              results.updated++
            } else {
              await prisma.translation.create({ data: { locale, key, value } })
              results.inserted++
            }
          }

          return Response.json(results)
        } catch (err) {
          console.error('Import failed', err)
          return new Response(String(err), { status: 500 })
        }
      }),
    },
  },
})
