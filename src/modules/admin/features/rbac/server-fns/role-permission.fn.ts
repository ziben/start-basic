/**
 * RolePermission ServerFn - 角色权限服务器函数层
 *
 * [迁移自 admin/shared/server-fns/role-permission.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const AssignPermissionsSchema = z.object({
    roleId: z.string().min(1, '角色ID不能为空'),
    permissions: z.array(z.object({
        permissionId: z.string(),
        dataScope: z.string().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
    }))
})

const UpdateDataScopeSchema = z.object({
    rolePermissionId: z.string().min(1),
    dataScope: z.string().min(1),
})

// ============ ServerFn 定义 ============

/**
 * 获取角色的权限列表
 *
 * [迁移自 admin/shared/server-fns/role-permission.fn.ts]
 */
export const getRolePermissionsFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { roleId: string }) => {
        if (!data?.roleId) throw new Error('角色ID不能为空')
        return data
    })
    .handler(async ({ data }: { data: { roleId: string } }) => {
        await requireAdmin('GetRolePermissions')
        const { RolePermissionService } = await import('../permissions/services/role-permission.service')
        return RolePermissionService.getRolePermissions(data.roleId)
    })

/**
 * 为角色分配权限
 *
 * [迁移自 admin/shared/server-fns/role-permission.fn.ts]
 */
export const assignRolePermissionsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof AssignPermissionsSchema>) =>
        AssignPermissionsSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof AssignPermissionsSchema> }) => {
        await requireAdmin('AssignRolePermissions')
        const { RolePermissionService } = await import('../permissions/services/role-permission.service')

        // 转换日期字符串为 Date 对象
        const permissions = data.permissions.map(p => ({
            ...p,
            validFrom: p.validFrom ? new Date(p.validFrom) : undefined,
            validUntil: p.validUntil ? new Date(p.validUntil) : undefined,
        }))

        return RolePermissionService.assignPermissions(data.roleId, permissions)
    })

/**
 * 更新权限的数据范围
 *
 * [迁移自 admin/shared/server-fns/role-permission.fn.ts]
 */
export const updateRolePermissionDataScopeFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateDataScopeSchema>) =>
        UpdateDataScopeSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof UpdateDataScopeSchema> }) => {
        await requireAdmin('UpdateRolePermissionDataScope')
        const { RolePermissionService } = await import('../permissions/services/role-permission.service')
        return RolePermissionService.updateDataScope(data.rolePermissionId, data.dataScope)
    })

/**
 * 删除角色的单个权限
 *
 * [迁移自 admin/shared/server-fns/role-permission.fn.ts]
 */
export const removeRolePermissionFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { rolePermissionId: string }) => {
        if (!data?.rolePermissionId) throw new Error('权限ID不能为空')
        return data
    })
    .handler(async ({ data }: { data: { rolePermissionId: string } }) => {
        await requireAdmin('RemoveRolePermission')
        const { RolePermissionService } = await import('../permissions/services/role-permission.service')
        return RolePermissionService.removePermission(data.rolePermissionId)
    })
