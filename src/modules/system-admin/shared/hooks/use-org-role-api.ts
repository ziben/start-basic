/**
 * Organization Role API Hooks - 使用 better-auth dynamicAccessControl API
 * 用于组织级动态角色管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient } from '~/modules/identity/shared/lib/auth-client'

export const ORG_ROLES_QUERY_KEY = ['org-roles']

// 角色类型定义
export interface OrgRole {
    id: string
    role: string
    permission: Record<string, string[]> | null
    organizationId: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

/**
 * 获取组织的角色列表（包括内置和动态角色）
 */
export function useOrgRoles(organizationId: string) {
    return useQuery({
        queryKey: [...ORG_ROLES_QUERY_KEY, organizationId],
        queryFn: async () => {
            const { data, error } = await authClient.organization.listRoles({
                query: { organizationId }
            })
            if (error) throw new Error(error.message || '获取角色列表失败')
            return data
        },
        enabled: !!organizationId
    })
}

/**
 * 获取单个角色详情
 */
export function useOrgRole(params: { roleId?: string; roleName?: string; organizationId: string }) {
    const { roleId, roleName, organizationId } = params
    return useQuery({
        queryKey: [...ORG_ROLES_QUERY_KEY, organizationId, roleId || roleName],
        queryFn: async () => {
            const { data, error } = await authClient.organization.getRole({
                query: {
                    roleId,
                    roleName,
                    organizationId
                }
            })
            if (error) throw new Error(error.message || '获取角色详情失败')
            return data
        },
        enabled: !!organizationId && !!(roleId || roleName)
    })
}

/**
 * 创建新角色
 */
export function useCreateOrgRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            role: string
            permission?: Record<string, string[]>
            organizationId: string
        }) => {
            const { data: result, error } = await authClient.organization.createRole({
                role: data.role,
                permission: data.permission || {},
                organizationId: data.organizationId,
            })
            if (error) throw new Error(error.message || '创建角色失败')
            return result
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...ORG_ROLES_QUERY_KEY, variables.organizationId]
            })
            toast.success('角色创建成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '创建失败')
        }
    })
}

/**
 * 更新角色
 */
export function useUpdateOrgRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            roleId?: string
            roleName?: string
            organizationId: string
            data: {
                roleName?: string
                permission?: Record<string, string[]>
            }
        }) => {
            const { data: result, error } = await authClient.organization.updateRole({
                roleId: data.roleId,
                roleName: data.roleName,
                organizationId: data.organizationId,
                data: data.data
            })
            if (error) throw new Error(error.message || '更新角色失败')
            return result
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...ORG_ROLES_QUERY_KEY, variables.organizationId]
            })
            toast.success('角色更新成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败')
        }
    })
}

/**
 * 删除角色
 */
export function useDeleteOrgRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            roleId?: string
            roleName?: string
            organizationId: string
        }) => {
            const { data: result, error } = await authClient.organization.deleteRole({
                roleId: data.roleId,
                roleName: data.roleName,
                organizationId: data.organizationId,
            })
            if (error) throw new Error(error.message || '删除角色失败')
            return result
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...ORG_ROLES_QUERY_KEY, variables.organizationId]
            })
            toast.success('角色删除成功')
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败')
        }
    })
}

/**
 * 检查当前用户是否有指定权限
 */
export function useHasPermission(permission: [string, string]) {
    return useQuery({
        queryKey: ['has-permission', permission],
        queryFn: async () => {
            const { data, error } = await authClient.organization.hasPermission({
                permission: { [permission[0]]: [permission[1]] }
            })
            if (error) return false
            return data?.success ?? false
        }
    })
}
