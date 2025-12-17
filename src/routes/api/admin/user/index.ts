import { createFileRoute } from '@tanstack/react-router'
import { adminUsersPageSchema } from '~/features/admin/users/data/schema'
import { z } from 'zod'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'
import type { Prisma, User as PrismaUser } from '~/generated/prisma/client'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  filter: z.string().optional().default(''),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const Route = createFileRoute('/api/admin/user/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const parsed = querySchema.parse({
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
          filter: url.searchParams.get('filter') ?? undefined,
          sortBy: url.searchParams.get('sortBy') ?? undefined,
          sortDir: url.searchParams.get('sortDir') ?? undefined,
        })

        const q = parsed.filter.trim()
        const where: Prisma.UserWhereInput = q
          ? {
              OR: [
                { id: { contains: q } },
                { name: { contains: q } },
                { email: { contains: q } },
                { username: { contains: q } },
              ],
            }
          : {}

        const allowedSort = [
          'createdAt',
          'updatedAt',
          'name',
          'email',
          'username',
          'role',
          'banned',
        ] as const
        type SortField = (typeof allowedSort)[number]

        const isAllowedSortField = (v: string): v is SortField =>
          (allowedSort as readonly string[]).includes(v)

        const orderBy: Prisma.UserOrderByWithRelationInput =
          parsed.sortBy && isAllowedSortField(parsed.sortBy)
            ? { [parsed.sortBy]: parsed.sortDir ?? 'asc' }
            : { createdAt: 'desc' }

        const pageSize = parsed.pageSize
        const page = parsed.page
        const skip = (page - 1) * pageSize

        const [total, users] = await Promise.all([
          prisma.user.count({ where }),
          prisma.user.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
          }),
        ])

        const pageCount = Math.ceil(total / pageSize)

        const items = (users as PrismaUser[]).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image ?? null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          role: u.role ?? 'user',
          banned: u.banned ?? null,
          banReason: u.banReason ?? null,
          banExpires: u.banExpires ?? null,
          username: u.username ?? null,
          displayUsername: u.displayUsername ?? null,
        }))

        return Response.json(
          adminUsersPageSchema.parse({
            items,
            total,
            page,
            pageSize,
            pageCount,
          })
        )
      }),
    },
  }
})
