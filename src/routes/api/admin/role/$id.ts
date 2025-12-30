import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/modules/system-admin/shared/utils/admin-utils'

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export const Route = createFileRoute('/api/admin/role/$id')({
  server: {
    handlers: {
      GET: withAdminAuth(async ({ params }) => {
        const { id } = params
        const role = await prisma.systemRole.findUnique({
          where: { id },
          include: {
            navGroups: {
              include: {
                navGroup: true,
              },
            },
          },
        })

        if (!role) {
          return new Response('Role not found', { status: 404 })
        }

        return Response.json(role)
      }),

      PATCH: withAdminAuth(async (ctx) => {
        const { params, request } = ctx
        const { id } = params
        try {
          const body = await request.json()
          const input = updateBodySchema.parse(body)

          const role = await prisma.systemRole.findUnique({
            where: { id },
          })

          if (!role) {
            return new Response('Role not found', { status: 404 })
          }

          if (role.isSystem && input.name && input.name !== role.name) {
            return new Response('Cannot change system role name', { status: 403 })
          }

          const updated = await prisma.systemRole.update({
            where: { id },
            data: {
              name: input.name,
              label: input.label,
              description: input.description,
            },
          })

          void ctx.audit.log({
            action: 'role.update',
            targetType: 'role',
            targetId: id,
            success: true,
            message: '更新角色',
            meta: { ...input },
          })

          return Response.json(updated)
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),

      DELETE: withAdminAuth(async (ctx) => {
        const { params } = ctx
        const { id } = params
        try {
          const role = await prisma.systemRole.findUnique({
            where: { id },
          })

          if (!role) {
            return new Response('Role not found', { status: 404 })
          }

          if (role.isSystem) {
            return new Response('Cannot delete system role', { status: 403 })
          }

          await prisma.systemRole.delete({
            where: { id },
          })

          void ctx.audit.log({
            action: 'role.delete',
            targetType: 'role',
            targetId: id,
            success: true,
            message: '删除角色',
            meta: { name: role.name },
          })

          return Response.json({ success: true, id })
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
