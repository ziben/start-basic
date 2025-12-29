import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/translation/export')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }: any) => {
        const qs = new URL(request.url).searchParams
        const locale = qs.get('locale') || undefined

        const where: any = {}
        if (locale) where.locale = locale

        const items = await prisma.translation.findMany({ where, orderBy: { key: 'asc' } })
        const csv = ['locale,key,value']
        for (const it of items) {
          // simple CSV escaping
          const line = `${it.locale},"${String(it.key).replace(/"/g, '""')}","${String(it.value).replace(/"/g, '""')}"`
          csv.push(line)
        }

        return new Response(csv.join('\n'), {
          headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="translations.csv"' },
        })
      }),
    },
  },
})





