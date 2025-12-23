import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { adminUsersPageSchema, adminUsersSchema } from '~/features/admin/users/data/schema'
import type { Prisma } from '~/generated/prisma/client'
import prisma from '~/lib/db'
import { withAdminAuth } from '~/middleware'
import { serializeAdminUser, serializeAdminUsers, isValidUserSortField, handleError, getErrorStatus } from '~/lib/admin-utils'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  filter: z.string().optional().default(''),
  banned: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
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
          banned: url.searchParams.get('banned') ?? undefined,
          sortBy: url.searchParams.get('sortBy') ?? undefined,
          sortDir: url.searchParams.get('sortDir') ?? undefined,
        })

        const q = parsed.filter.trim()
        const where: Prisma.UserWhereInput = {
          ...(q
            ? {
                OR: [
                  { id: { contains: q } },
                  { name: { contains: q } },
                  { email: { contains: q } },
                  { username: { contains: q } },
                ],
              }
            : {}),
          ...(typeof parsed.banned === 'boolean' ? { banned: parsed.banned } : {}),
        }

        const orderBy: Prisma.UserOrderByWithRelationInput =
          parsed.sortBy && isValidUserSortField(parsed.sortBy)
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
        const items = serializeAdminUsers(users as any)

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
            const error = handleError('Create user failed: missing user id')
            return Response.json(error, { status: 500 })
          }

          const updated = await prisma.user.update({
            where: { id: newUserId },
            data: {
              role: input.role,
              banned: input.banned,
              username: input.username ?? undefined,
            },
          })

          return Response.json(adminUsersSchema.parse(serializeAdminUser(updated)))
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
