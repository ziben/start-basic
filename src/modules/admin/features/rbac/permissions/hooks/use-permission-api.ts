/**
 * Permission API Hooks - React Query hooks for permission management
 * [迁移自 admin/shared/hooks/use-permission-api.ts]
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    getPermissionsFn,
    createPermissionFn,
    updatePermissionFn,
    deletePermissionFn,
} from '../../server-fns/rbac.fn'
import { permissionsQueryKeys, rbacPermissionsQueryKeys } from '~/shared/lib/query-keys'

type PermissionListItem = {
    id: string
    resource?: { name?: string | null } | null
    action?: { name?: string | null } | null
}

/**
 * 获取权限列表（分页）
 */
export function usePermissions(params?: {
    page?: number
    pageSize?: number
    filter?: string
    resource?: string
}) {
    return useQuery({
        queryKey: rbacPermissionsQueryKeys.list(params),
        queryFn: async () => {
            return await getPermissionsFn({ data: params })
        }
    })
}

/**
 * 获取所有权限（不分页）
 */
export function useAllPermissions(options?: {
    resource?: string
    action?: string
}) {
    return useQuery({
        queryKey: rbacPermissionsQueryKeys.allList(options),
        queryFn: async () => {
            const permissions = (await getPermissionsFn()) as PermissionListItem[]
            if (!options?.resource && !options?.action) return permissions
            return permissions.filter((permission: PermissionListItem) => {
                if (options?.resource && permission.resource?.name !== options.resource) return false
                if (options?.action && permission.action?.name !== options.action) return false
                return true
            })
        }
    })
}

/**
 * 获取单个权限
 */
export function usePermission(id: string) {
    return useQuery({
        queryKey: rbacPermissionsQueryKeys.detail(id),
        queryFn: async () => {
            const permissions = (await getPermissionsFn()) as PermissionListItem[]
            return permissions.find((permission: PermissionListItem) => permission.id === id) ?? null
        },
        enabled: !!id
    })
}

/**
 * 创建权限
 */
export function useCreatePermission() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            resource: string
            action: string
            label: string
            description?: string
        }) => {
            return await createPermissionFn({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('权限创建成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '创建失败')
        }
    })
}

/**
 * 更新权限
 */
export function useUpdatePermission() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            id: string
            label?: string
            description?: string | null
        }) => {
            return await updatePermissionFn({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('权限更新成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败')
        }
    })
}

/**
 * 删除权限
 */
export function useDeletePermission() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            return await deletePermissionFn({ data: { id } })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rbacPermissionsQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
            toast.success('权限删除成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败')
        }
    })
}
