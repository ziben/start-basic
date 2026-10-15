import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { clearAccessControlCache, reinitAuth } from '~/modules/auth/shared/lib/auth'
import { ServiceError } from '~/shared/utils/service-error'

export async function handleUpdateRole({
  data,
}: {
  data: { id: string; displayName?: string; description?: string; isActive?: boolean; permissionIds?: string[] }
}) {
  await requireAdmin('UpdateRole')
  const prisma = (await import('@/shared/lib/db')).default

  const { id, permissionIds, ...updateData } = data

  const updated = await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { id } })
    if (!role) throw new ServiceError('NOT_FOUND', '角色不存在')
    if (role.isSystem) throw new ServiceError('FORBIDDEN', '系统角色不允许修改')

    const result = await tx.role.update({ where: { id }, data: updateData })
    if (permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } })
      const ids = [...new Set(permissionIds)]
      if (ids.length > 0) {
        await tx.rolePermission.createMany({
          data: ids.map((permissionId) => ({ roleId: id, permissionId })),
        })
      }
    }
    return result
  })

  // 清除缓存并重新初始化 auth
  clearAccessControlCache()
  await reinitAuth()

  return updated
}

export async function handleAssignPermissions({ data }: { data: { roleId: string; permissionIds: string[] } }) {
  await requireAdmin('AssignPermissions')
  const prisma = (await import('@/shared/lib/db')).default

  await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { id: data.roleId } })
    if (!role) throw new ServiceError('NOT_FOUND', '角色不存在')
    if (role.isSystem) throw new ServiceError('FORBIDDEN', '系统角色不允许修改权限')

    await tx.rolePermission.deleteMany({ where: { roleId: data.roleId } })
    const ids = [...new Set(data.permissionIds)]
    if (ids.length > 0) {
      await tx.rolePermission.createMany({
        data: ids.map((permissionId) => ({ roleId: data.roleId, permissionId })),
      })
    }
  })

  // 清除缓存并重新初始化 auth
  clearAccessControlCache()
  await reinitAuth()

  return { success: true }
}
