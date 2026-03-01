/**
 * RolePermission Service - 角色权限管理业务逻辑层
 * [迁移自 admin/shared/services/role-permission.service.ts]
 */

import prisma from '@/shared/lib/db'

export const RolePermissionService = {
    /**
     * 获取角色的权限列表
     */
    async getRolePermissions(roleId: string) {
        try {
            return await prisma.rolePermission.findMany({
                where: { roleId },
                include: {
                    permission: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } catch (error) {
            console.error('获取角色权限失败:', error)
            throw new Error('获取角色权限失败')
        }
    },

    /**
     * 为角色分配权限
     */
    async assignPermissions(
        roleId: string,
        permissions: Array<{
            permissionId: string
            dataScope?: string
            validFrom?: Date
            validUntil?: Date
        }>
    ) {
        try {
            // 验证角色是否存在
            const role = await prisma.systemRole.findUnique({
                where: { id: roleId }
            })

            if (!role) {
                throw new Error('角色不存在')
            }

            return await prisma.$transaction(async (tx) => {
                // 1. 删除现有权限
                await tx.rolePermission.deleteMany({
                    where: { roleId }
                })

                // 2. 创建新权限
                if (permissions.length > 0) {
                    await tx.rolePermission.createMany({
                        data: permissions.map(p => ({
                            roleId,
                            permissionId: p.permissionId,
                            dataScope: p.dataScope || 'SELF',
                            validFrom: p.validFrom,
                            validUntil: p.validUntil,
                        }))
                    })
                }

                return { success: true as const }
            })
        } catch (error) {
            console.error('分配权限失败:', error)
            throw error instanceof Error ? error : new Error('分配权限失败')
        }
    },

    /**
     * 更新单个权限的数据范围
     */
    async updateDataScope(
        rolePermissionId: string,
        dataScope: string
    ) {
        try {
            return await prisma.rolePermission.update({
                where: { id: rolePermissionId },
                data: { dataScope }
            })
        } catch (error) {
            console.error('更新数据范围失败:', error)
            throw new Error('更新数据范围失败')
        }
    },

    /**
     * 删除角色的单个权限
     */
    async removePermission(rolePermissionId: string) {
        try {
            await prisma.rolePermission.delete({
                where: { id: rolePermissionId }
            })

            return { success: true as const }
        } catch (error) {
            console.error('删除权限失败:', error)
            throw new Error('删除权限失败')
        }
    }
}

export default RolePermissionService
