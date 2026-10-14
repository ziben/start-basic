import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { clearAccessControlCache, reinitAuth } from '~/modules/auth/shared/lib/auth'
import { getRoleNameById } from '~/modules/auth/shared/services/role.service'
import { ServiceError } from '~/shared/utils/service-error'

const AssignRoleNavGroupsSchema = z.object({
  id: z.string().min(1),
  navGroupIds: z.array(z.string().min(1)),
})

export const assignRoleNavGroupsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof AssignRoleNavGroupsSchema>) => AssignRoleNavGroupsSchema.parse(data))
  .handler(handleAssignRoleNavGroups)

export async function handleAssignRoleNavGroups({ data }: { data: z.infer<typeof AssignRoleNavGroupsSchema> }) {
  await requireAdmin('AssignRoleNavGroups')
  const prisma = (await import('@/shared/lib/db')).default
  const roleName = await getRoleNameById(data.id)
  if (!roleName) throw new ServiceError('NOT_FOUND', '角色不存在')

  const navGroupIds = [...new Set(data.navGroupIds)]
  await prisma.$transaction(async (tx) => {
    const navGroups = await tx.navGroup.findMany({
      where: { id: { in: navGroupIds } },
      select: { id: true },
    })
    if (navGroups.length !== navGroupIds.length) {
      throw new ServiceError('BAD_REQUEST', '所选菜单组已不存在，请刷新后重试')
    }

    await tx.roleNavGroup.deleteMany({ where: { roleName } })
    if (navGroupIds.length > 0) {
      await tx.roleNavGroup.createMany({
        data: navGroupIds.map((navGroupId) => ({ roleName, navGroupId })),
      })
    }
  })

  clearAccessControlCache()
  await reinitAuth()

  return { success: true }
}
