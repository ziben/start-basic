import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { adminUsersSchema } from '@/modules/system-admin/features/identity/users'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'
import { serializeAdminUser, handleError, getErrorStatus } from '~/modules/system-admin/shared/utils/admin-utils'

const bodySchema = z
  .object({
    name: z.string().min(1).optional(),
    username: z.string().min(1).nullable().optional(),
    role: z.string().nullable().optional(),
    roleIds: z.array(z.string()).nullable().optional(),
    banned: z.boolean().nullable().optional(),
    banReason: z.string().nullable().optional(),
    banExpires: z.string().datetime().nullable().optional(),
  })
  .strict()

export const Route = createFileRoute('/api/admin/user/$id')({
  server: {
    handlers: {
      PATCH: withAdminAuth(async (ctx) => {
        const { request, params } = ctx
        if (!params?.id) {
          return Response.json({ type: 'bad_request', message: 'Missing user ID' }, { status: 400 })
        }
        try {
          const body = await request.json()
          const data = bodySchema.parse(body)

          const updated = await prisma.user.update({
            where: { id: params.id },
            data: {
              ...(data.name !== undefined ? { name: data.name } : {}),
              ...(data.username !== undefined ? { username: data.username } : {}),
              ...(data.role !== undefined ? { role: data.role } : {}),
              ...(data.roleIds !== undefined ? { 
                systemRoles: data.roleIds ? {
                  set: data.roleIds.map(id => ({ id }))
                } : { set: [] }
              } : {}),
              ...(data.banned !== undefined ? { banned: data.banned } : {}),
              ...(data.banReason !== undefined ? { banReason: data.banReason } : {}),
              ...(data.banExpires !== undefined
                ? { banExpires: data.banExpires ? new Date(data.banExpires) : null }
                : {}),
            },
            include: {
              systemRoles: true
            }
          })

          void ctx.audit.log({
            action: 'user.update',
            targetType: 'user',
            targetId: params.id,
            success: true,
            message: '更新用户',
            meta: data,
          })

          return Response.json(adminUsersSchema.parse(serializeAdminUser(updated)))
        } catch (error) {
          void ctx.audit.log({
            action: 'user.update',
            targetType: 'user',
            targetId: params.id,
            success: false,
            message: '更新用户失败',
            meta: { error: String(error) },
          })
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),

      DELETE: withAdminAuth(async (ctx) => {
        const { params } = ctx
        if (!params?.id) {
          return Response.json({ type: 'bad_request', message: 'Missing user ID' }, { status: 400 })
        }
        try {
          await prisma.user.delete({
            where: { id: params.id },
          })

          void ctx.audit.log({
            action: 'user.delete',
            targetType: 'user',
            targetId: params.id,
            success: true,
            message: '删除用户',
            meta: null,
          })

          return new Response(null, { status: 204 })
        } catch (error) {
          void ctx.audit.log({
            action: 'user.delete',
            targetType: 'user',
            targetId: params.id,
            success: false,
            message: '删除用户失败',
            meta: { error: String(error) },
          })
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})







