import { createFileRoute } from '@tanstack/react-router'
import prisma from '@/shared/lib/db'
import { withAdminAuth } from '~/middleware'
import { handleError, getErrorStatus } from '~/modules/system-admin/shared/utils/admin-utils'

export const Route = createFileRoute('/api/admin/role/$id/nav-groups')({
  server: {
    handlers: {
      POST: withAdminAuth(async (ctx) => {
        const { params, request } = ctx
        const { id } = params
        try {
          const body = await request.json()
          const { navGroupIds } = body as { navGroupIds: string[] }

          if (!Array.isArray(navGroupIds)) {
            return new Response('navGroupIds must be an array', { status: 400 })
          }

          // 使用事务更新关系
          await prisma.$transaction(async (tx) => {
            // 先删除旧的关系
            await tx.roleNavGroup.deleteMany({
              where: { roleId: id },
            })

            // 创建新的关系
            if (navGroupIds.length > 0) {
              await tx.roleNavGroup.createMany({
                data: navGroupIds.map((navGroupId) => ({
                  roleId: id,
                  navGroupId,
                })),
              })
            }
          })

          void ctx.audit.log({
            action: 'role.assign_nav_groups',
            targetType: 'role',
            targetId: id,
            success: true,
            message: '分配角色导航组',
            meta: { navGroupIds },
          })

          return Response.json({ success: true })
        } catch (error) {
          const apiError = handleError(error)
          return Response.json(apiError, { status: getErrorStatus(apiError.type) })
        }
      }),
    },
  },
})
