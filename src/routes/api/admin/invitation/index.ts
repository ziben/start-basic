import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

export const Route = createFileRoute('/api/admin/invitation/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10') || 10))
        const filter = (url.searchParams.get('filter') ?? '').trim()
        const organizationId = url.searchParams.get('organizationId')
        const status = url.searchParams.get('status')
        const sortByRaw = (url.searchParams.get('sortBy') ?? '').trim()
        const sortDirRaw = (url.searchParams.get('sortDir') ?? '').trim()

        const filterWhere = filter
          ? {
              OR: [
                { id: { contains: filter, mode: 'insensitive' as const } },
                { email: { contains: filter, mode: 'insensitive' as const } },
                { role: { contains: filter, mode: 'insensitive' as const } },
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

        const statusWhere = status ? { status } : {}

        const where = {
          ...filterWhere,
          ...statusWhere,
          ...(organizationId && { organizationId }),
        }

        const allowedSort = ['id', 'email', 'role', 'status', 'createdAt', 'expiresAt'] as const
        type SortField = (typeof allowedSort)[number]
        const isAllowedSortField = (v: string): v is SortField => (allowedSort as readonly string[]).includes(v)

        const sortDir = sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : undefined
        const orderBy = isAllowedSortField(sortByRaw)
          ? ({ [sortByRaw]: sortDir ?? 'asc' } as any)
          : ({ createdAt: 'desc' } as any)

        const [total, invitations] = await Promise.all([
          prisma.invitation.count({ where }),
          prisma.invitation.findMany({
            where,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
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

        const items = invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          organizationId: invitation.organizationId,
          organizationName: invitation.organization?.name ?? '',
          organizationSlug: invitation.organization?.slug ?? '',
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt?.toISOString() ?? null,
        }))

        const pageCount = Math.ceil(total / pageSize)
        return Response.json({ items, total, pageCount })
      }),

      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const schema = z.object({
            organizationId: z.string().min(1),
            email: z.string().email(),
            role: z.string().min(1),
            expiresAt: z.string().optional(),
          })
          const input = schema.parse(body)

          const existing = await prisma.invitation.findFirst({
            where: {
              organizationId: input.organizationId,
              email: input.email,
              status: 'pending',
            },
          })
          if (existing) {
            return new Response('Invitation already exists for this email', { status: 400 })
          }

          const invitation = await prisma.invitation.create({
            data: {
              id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              organizationId: input.organizationId,
              email: input.email,
              role: input.role,
              status: 'pending',
              createdAt: new Date(),
              expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            },
            include: {
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
            id: invitation.id,
            email: invitation.email,
            organizationId: invitation.organizationId,
            organizationName: invitation.organization?.name ?? '',
            organizationSlug: invitation.organization?.slug ?? '',
            role: invitation.role,
            status: invitation.status,
            createdAt: invitation.createdAt.toISOString(),
            expiresAt: invitation.expiresAt?.toISOString() ?? null,
          })
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
