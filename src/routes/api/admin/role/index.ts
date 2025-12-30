import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { systemRoleSchema } from '@/modules/system-admin/features/identity/roles/data/schema'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/modules/system-admin/shared/utils/admin-utils'

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  filter: z.string().optional().default(''),
})

const createBodySchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute('/api/admin/role/')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const parsed = querySchema.parse({
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
          filter: url.searchParams.get('filter') ?? undefined,
        })

        const q = parsed.filter.trim()
        const where = q
          ? {
              OR: [
                { name: { contains: q } },
                { label: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {}

        const pageSize = parsed.pageSize
        const page = parsed.page
        const skip = (page - 1) * pageSize

        const [total, roles] = await Promise.all([
          prisma.systemRole.count({ where }),
          prisma.systemRole.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
          }),
        ])

        const pageCount = Math.ceil(total / pageSize)

        return Response.json({
          items: roles,
          total,
          page,
          pageSize,
          pageCount,
        })
      }),

      POST: withAdminAuth(async (ctx) => {
        const { request } = ctx
        try {
          const body = await request.json()
          const input = createBodySchema.parse(body)

          const role = await prisma.systemRole.create({
            data: {
              name: input.name,
              label: input.label,
              description: input.description,
            },
          })

          void ctx.audit.log({
            action: 'role.create',
            targetType: 'role',
            targetId: role.id,
            success: true,
            message: '创建角色',
            meta: { name: role.name, label: role.label },
          })

          return Response.json(role)
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
