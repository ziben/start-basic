/**
 * Permission API Hooks - React Query hooks for permission management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    getPermissionsFn,
    getAllPermissionsFn,
    getPermissionFn,
    createPermissionFn,
    updatePermissionFn,
    deletePermissionFn,
} from '../server-fns/permission.fn'

export const PERMISSIONS_QUERY_KEY = ['permissions']

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
        queryKey: [...PERMISSIONS_QUERY_KEY, 'list', params],
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
        queryKey: [...PERMISSIONS_QUERY_KEY, 'all', options],
        queryFn: async () => {
            return await getAllPermissionsFn({ data: options })
        }
    })
}

/**
 * 获取单个权限
 */
export function usePermission(id: string) {
    return useQuery({
        queryKey: [...PERMISSIONS_QUERY_KEY, id],
        queryFn: async () => {
            return await getPermissionFn({ data: { id } })
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
            queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
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
            queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
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
            queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
            toast.success('权限删除成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败')
        }
    })
}
