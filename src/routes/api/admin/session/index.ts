import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/session/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10') || 10))
        const filter = (url.searchParams.get('filter') ?? '').trim()

        const sortByRaw = (url.searchParams.get('sortBy') ?? '').trim()
        const sortDirRaw = (url.searchParams.get('sortDir') ?? '').trim()

        const legacyActive = url.searchParams.get('active')
        const rawStatus = url.searchParams
          .getAll('status')
          .flatMap((s) => s.split(','))
          .map((s) => s.trim())
        const status = rawStatus.filter(Boolean) as Array<'active' | 'expired' | string>

        const now = new Date()

        const statusWhere = (() => {
          if (status.includes('active') && !status.includes('expired')) return { expiresAt: { gt: now } }
          if (status.includes('expired') && !status.includes('active')) return { expiresAt: { lte: now } }
          if (legacyActive === 'true') return { expiresAt: { gt: now } }
          if (legacyActive === 'false') return { expiresAt: { lte: now } }
          return {}
        })()

        const filterWhere = filter
          ? {
              OR: [
                { id: { contains: filter, mode: 'insensitive' as const } },
                { userId: { contains: filter, mode: 'insensitive' as const } },
                { ipAddress: { contains: filter, mode: 'insensitive' as const } },
                { userAgent: { contains: filter, mode: 'insensitive' as const } },
                {
                  user: {
                    OR: [
                      { name: { contains: filter, mode: 'insensitive' as const } },
                      { email: { contains: filter, mode: 'insensitive' as const } },
                    ],
                  },
                },
              ],
            }
          : {}

        const where = {
          ...statusWhere,
          ...filterWhere,
        }

        const allowedSort = ['id', 'createdAt', 'expiresAt', 'updatedAt', 'userId', 'ipAddress'] as const
        type SortField = (typeof allowedSort)[number]
        const isAllowedSortField = (v: string): v is SortField => (allowedSort as readonly string[]).includes(v)

        const sortDir = sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : undefined
        const orderBy = isAllowedSortField(sortByRaw)
          ? ({ [sortByRaw]: sortDir ?? 'asc' } as any)
          : ({ createdAt: 'desc' } as any)

        const [total, sessions] = await Promise.all([
          prisma.session.count({ where }),
          prisma.session.findMany({
            where,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
        ])

        const items = sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          username: s.user?.name ?? '',
          email: s.user?.email ?? '',
          loginTime: s.createdAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          ipAddress: s.ipAddress ?? '',
          userAgent: s.userAgent ?? '',
          isActive: s.expiresAt > now,
        }))

        const pageCount = Math.ceil(total / pageSize)
        return Response.json({ items, total, pageCount })
      }),

      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const schema = z.object({
            ids: z.array(z.string().min(1)).min(1),
          })
          const input = schema.parse(body)

          const result = await prisma.session.deleteMany({
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





