/**
 * RolePermission API Hooks - React Query hooks for role-permission management
 * [迁移自 admin/shared/hooks/use-role-permission-api.ts]
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    getRolePermissionsFn,
    assignRolePermissionsFn,
    updateRolePermissionDataScopeFn,
    removeRolePermissionFn,
} from '../../server-fns/role-permission.fn'
import { permissionsQueryKeys, rolePermissionsQueryKeys } from '~/shared/lib/query-keys'

/**
 * 获取角色的权限列表
 */
export function useRolePermissions(roleId: string) {
    return useQuery({
        queryKey: rolePermissionsQueryKeys.list(roleId),
        queryFn: async () => {
            return await getRolePermissionsFn({ data: { roleId } })
        },
        enabled: !!roleId
    })
}

/**
 * 为角色分配权限
 */
export function useAssignRolePermissions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            roleId: string
            permissions: Array<{
                permissionId: string
                dataScope?: string
                validFrom?: string
                validUntil?: string
            }>
        }) => {
            return await assignRolePermissionsFn({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('权限分配成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '分配失败')
        }
    })
}

/**
 * 更新权限的数据范围
 */
export function useUpdateRolePermissionDataScope() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            rolePermissionId: string
            dataScope: string
        }) => {
            return await updateRolePermissionDataScopeFn({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('数据范围更新成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败')
        }
    })
}

/**
 * 删除角色的单个权限
 */
export function useRemoveRolePermission() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (rolePermissionId: string) => {
            return await removeRolePermissionFn({ data: { rolePermissionId } })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('权限删除成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败')
        }
    })
}
