import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'

const querySchema = z.object({
  type: z.enum(['system', 'audit']).optional().default('system'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  filter: z.string().optional().default(''),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  success: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
  action: z.string().optional(),
  actorUserId: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const Route = createFileRoute('/api/admin/log/' as any)({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ request }) => {
        const url = new URL(request.url)
        const parsed = querySchema.parse({
          type: url.searchParams.get('type') ?? undefined,
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
          filter: url.searchParams.get('filter') ?? undefined,
          level: url.searchParams.get('level') ?? undefined,
          success: url.searchParams.get('success') ?? undefined,
          action: url.searchParams.get('action') ?? undefined,
          actorUserId: url.searchParams.get('actorUserId') ?? undefined,
          targetType: url.searchParams.get('targetType') ?? undefined,
          targetId: url.searchParams.get('targetId') ?? undefined,
          from: url.searchParams.get('from') ?? undefined,
          to: url.searchParams.get('to') ?? undefined,
        })

        const page = parsed.page
        const pageSize = parsed.pageSize
        const skip = (page - 1) * pageSize
        const q = parsed.filter.trim()
        const from = parsed.from ? new Date(parsed.from) : undefined
        const to = parsed.to ? new Date(parsed.to) : undefined

        if (parsed.type === 'audit') {
          const where = {
            ...(parsed.action ? { action: { contains: parsed.action } } : {}),
            ...(parsed.actorUserId ? { actorUserId: parsed.actorUserId } : {}),
            ...(parsed.targetType ? { targetType: parsed.targetType } : {}),
            ...(parsed.targetId ? { targetId: parsed.targetId } : {}),
            ...(typeof parsed.success === 'boolean' ? { success: parsed.success } : {}),
            ...(from || to
              ? {
                  createdAt: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {}),
                  },
                }
              : {}),
            ...(q
              ? {
                  OR: [
                    { action: { contains: q } },
                    { targetType: { contains: q } },
                    { targetId: { contains: q } },
                    { actorUserId: { contains: q } },
                    { actorRole: { contains: q } },
                    { message: { contains: q } },
                  ],
                }
              : {}),
          }

          const [total, items] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take: pageSize,
            }),
          ])

          return Response.json({
            type: 'audit' as const,
            items,
            total,
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
          })
        }

        const where = {
          ...(parsed.level ? { level: parsed.level } : {}),
          ...(parsed.actorUserId ? { userId: parsed.actorUserId } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
          ...(q
            ? {
                OR: [
                  { method: { contains: q } },
                  { path: { contains: q } },
                  { query: { contains: q } },
                  { requestId: { contains: q } },
                  { userId: { contains: q } },
                  { userRole: { contains: q } },
                  { error: { contains: q } },
                ],
              }
            : {}),
        }

        const [total, items] = await Promise.all([
          prisma.systemLog.count({ where }),
          prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
          }),
        ])

        return Response.json({
          type: 'system' as const,
          items,
          total,
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
        })
      }),
    },
  },
})




