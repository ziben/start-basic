import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/organization/member/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10') || 10))
        const filter = (url.searchParams.get('filter') ?? '').trim()
        const organizationId = url.searchParams.get('organizationId')
        const sortByRaw = (url.searchParams.get('sortBy') ?? '').trim()
        const sortDirRaw = (url.searchParams.get('sortDir') ?? '').trim()

        const filterWhere = filter
          ? {
              OR: [
                { id: { contains: filter, mode: 'insensitive' as const } },
                { role: { contains: filter, mode: 'insensitive' as const } },
                {
                  user: {
                    OR: [
                      { name: { contains: filter, mode: 'insensitive' as const } },
                      { email: { contains: filter, mode: 'insensitive' as const } },
                    ],
                  },
                },
                {
                  organization: {
                    OR: [
                      { name: { contains: filter, mode: 'insensitive' as const } },
                      { slug: { contains: filter, mode: 'insensitive' as const } },
                    ],
                  },
                },
              ],
            }
          : {}

        const where = {
          ...filterWhere,
          ...(organizationId && { organizationId }),
        }

        const allowedSort = ['id', 'role', 'createdAt', 'userId', 'organizationId'] as const
        type SortField = (typeof allowedSort)[number]
        const isAllowedSortField = (v: string): v is SortField => (allowedSort as readonly string[]).includes(v)

        const sortDir = sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : undefined
        const orderBy = isAllowedSortField(sortByRaw)
          ? ({ [sortByRaw]: sortDir ?? 'asc' } as any)
          : ({ createdAt: 'desc' } as any)

        const [total, members] = await Promise.all([
          prisma.member.count({ where }),
          prisma.member.findMany({
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
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          }),
        ])

        const items = members.map((member) => ({
          id: member.id,
          userId: member.userId,
          username: member.user?.name ?? '',
          email: member.user?.email ?? '',
          organizationId: member.organizationId,
          organizationName: member.organization?.name ?? '',
          organizationSlug: member.organization?.slug ?? '',
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        }))

        const pageCount = Math.ceil(total / pageSize)
        return Response.json({ items, total, pageCount })
      }),

      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const schema = z.object({
            organizationId: z.string().min(1),
            userId: z.string().min(1),
            role: z.string().min(1),
          })
          const input = schema.parse(body)

          const existing = await prisma.member.findFirst({
            where: {
              organizationId: input.organizationId,
              userId: input.userId,
            },
          })
          if (existing) {
            return new Response('User is already a member of this organization', { status: 400 })
          }

          const member = await prisma.member.create({
            data: {
              id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              organizationId: input.organizationId,
              userId: input.userId,
              role: input.role,
              createdAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          })

          return Response.json({
            id: member.id,
            userId: member.userId,
            username: member.user?.name ?? '',
            email: member.user?.email ?? '',
            organizationId: member.organizationId,
            organizationName: member.organization?.name ?? '',
            organizationSlug: member.organization?.slug ?? '',
            role: member.role,
            createdAt: member.createdAt.toISOString(),
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
