import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { adminUsersPageSchema } from '~/features/admin/users/data/schema'
import { adminUsersSchema } from '~/features/admin/users/data/schema'
import type { Prisma, User as PrismaUser } from '~/generated/prisma/client'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  filter: z.string().optional().default(''),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

const createBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['admin', 'user']).optional().default('user'),
  username: z.string().min(1).optional(),
  banned: z.boolean().optional().default(false),
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

        const allowedSort = ['createdAt', 'updatedAt', 'name', 'email', 'username', 'role', 'banned'] as const
        type SortField = (typeof allowedSort)[number]

        const isAllowedSortField = (v: string): v is SortField => (allowedSort as readonly string[]).includes(v)

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

      POST: withAdminAuth(async ({ request }) => {
        try {
          const body = await request.json()
          const input = createBodySchema.parse(body)

          const origin = new URL(request.url).origin

          // 通过 better-auth admin 插件创建用户（复用当前请求 cookie/session）
          const res = await fetch(`${origin}/api/auth/admin/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: request.headers.get('cookie') ?? '',
            },
            body: JSON.stringify({
              email: input.email,
              password: input.password,
              name: input.name,
              role: input.role,
              emailVerified: true,
              data: input.username ? { username: input.username } : undefined,
            }),
          })

          if (!res.ok) {
            const text = await res.text().catch(() => '')
            return new Response(text || 'Create user failed', { status: res.status })
          }

          const json = (await res.json().catch(() => null)) as any
          const newUserId = json?.newUser?.id ?? json?.user?.id ?? json?.id

          if (typeof newUserId !== 'string' || !newUserId) {
            return new Response('Create user failed: missing user id', { status: 500 })
          }

          const updated = await prisma.user.update({
            where: { id: newUserId },
            data: {
              role: input.role,
              banned: input.banned,
              username: input.username ?? undefined,
            },
          })

          return Response.json(
            adminUsersSchema.parse({
              id: updated.id,
              name: updated.name,
              email: updated.email,
              emailVerified: updated.emailVerified,
              image: updated.image ?? null,
              createdAt: updated.createdAt,
              updatedAt: updated.updatedAt,
              role: updated.role ?? 'user',
              banned: updated.banned ?? null,
              banReason: updated.banReason ?? null,
              banExpires: updated.banExpires ?? null,
              username: updated.username ?? null,
              displayUsername: updated.displayUsername ?? null,
            })
          )
        } catch (error) {
          return new Response(String(error), { status: 400 })
        }
      }),
    },
  },
})
