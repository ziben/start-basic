import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = (createFileRoute('/api/admin/organization/' as any) as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }: any) => {
        const url = new URL(request.url)
        const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10') || 10))
        const filter = (url.searchParams.get('filter') ?? '').trim()
        const sortByRaw = (url.searchParams.get('sortBy') ?? '').trim()
        const sortDirRaw = (url.searchParams.get('sortDir') ?? '').trim()

        const filterWhere = filter
          ? {
              OR: [
                { id: { contains: filter, mode: 'insensitive' as const } },
                { name: { contains: filter, mode: 'insensitive' as const } },
                { slug: { contains: filter, mode: 'insensitive' as const } },
              ],
            }
          : {}

        const where = filterWhere

        const allowedSort = ['id', 'name', 'slug', 'createdAt'] as const
        type SortField = (typeof allowedSort)[number]
        const isAllowedSortField = (v: string): v is SortField => (allowedSort as readonly string[]).includes(v)

        const sortDir = sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : undefined
        const orderBy = isAllowedSortField(sortByRaw)
          ? ({ [sortByRaw]: sortDir ?? 'asc' } as any)
          : ({ createdAt: 'desc' } as any)

        const [total, organizations] = await Promise.all([
          prisma.organization.count({ where }),
          prisma.organization.findMany({
            where,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              _count: {
                select: {
                  members: true,
                  invitations: true,
                },
              },
            },
          }),
        ])

        const items = (organizations as any[]).map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo ?? '',
          createdAt: org.createdAt.toISOString(),
          metadata: org.metadata ?? '',
          memberCount: org._count.members,
          invitationCount: org._count.invitations,
        }))

        const pageCount = Math.ceil(total / pageSize)
        return Response.json({ items, total, pageCount })
      }),

      POST: withAdminAuth(async ({ request }: any) => {
        try {
          const body = await request.json()
          const schema = z.object({
            name: z.string().min(1),
            slug: z.string().optional(),
            logo: z.string().optional(),
            metadata: z.record(z.string(), z.any()).optional(),
          })
          const input = schema.parse(body)

          const slug =
            input.slug ??
            input.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')

          const existing = await prisma.organization.findFirst({
            where: { slug },
          })
          if (existing) {
            return new Response('Organization with this slug already exists', { status: 400 })
          }

          const organization = await prisma.organization.create({
            data: {
              id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: input.name,
              slug,
              logo: input.logo ?? '',
              metadata: input.metadata ? JSON.stringify(input.metadata) : null,
              createdAt: new Date(),
            },
            include: {
              _count: {
                select: {
                  members: true,
                  invitations: true,
                },
              },
            },
          })

          return Response.json({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ?? '',
            createdAt: organization.createdAt.toISOString(),
            metadata: organization.metadata ?? '',
            memberCount: organization._count.members,
            invitationCount: organization._count.invitations,
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})




