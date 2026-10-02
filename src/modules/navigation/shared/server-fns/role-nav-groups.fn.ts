import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { clearAccessControlCache, reinitAuth } from '~/modules/auth/shared/lib/auth'
import { getRoleNameById } from '~/modules/auth/shared/services/role.service'
import { ServiceError } from '~/shared/utils/service-error'

const AssignRoleNavGroupsSchema = z.object({
  id: z.string().min(1),
  navGroupIds: z.array(z.string()),
})

export const assignRoleNavGroupsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof AssignRoleNavGroupsSchema>) => AssignRoleNavGroupsSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof AssignRoleNavGroupsSchema> }) => {
    await requireAdmin('AssignRoleNavGroups')
    const prisma = (await import('@/shared/lib/db')).default
    const roleName = await getRoleNameById(data.id)
    if (!roleName) throw new ServiceError('NOT_FOUND', '角色不存在')

    await prisma.roleNavGroup.deleteMany({ where: { roleName } })

    if (data.navGroupIds.length > 0) {
      const navGroups = await prisma.navGroup.findMany({
        where: { id: { in: data.navGroupIds } },
      })

      await prisma.roleNavGroup.createMany({
        data: navGroups.map((navGroup) => ({
          roleName,
          navGroupId: navGroup.id,
        })),
      })
    }

    clearAccessControlCache()
    await reinitAuth()

    return { success: true }
  })
