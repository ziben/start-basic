/**
 * Department API Hooks - React Query 封装
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getDepartmentsFn,
    getDepartmentTreeFn,
    getDepartmentFn,
    createDepartmentFn,
    updateDepartmentFn,
    deleteDepartmentFn,
    getSubDepartmentsFn,
} from '../server-fns/department.fn'
import { departmentQueryKeys } from '~/shared/lib/query-keys'

// ============ 类型定义 ============

export interface Department {
    id: string
    name: string
    code: string
    organizationId: string
    parentId: string | null
    level: number
    sort: number
    leader: string | null
    phone: string | null
    email: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    parent?: Department | null
    children?: Department[]
    members?: any[]
}

export interface CreateDepartmentData {
    name: string
    code: string
    organizationId: string
    parentId?: string
    leader?: string
    phone?: string
    email?: string
    sort?: number
}

export interface UpdateDepartmentData {
    name?: string
    code?: string
    parentId?: string | null
    leader?: string
    phone?: string
    email?: string
    sort?: number
    status?: 'ACTIVE' | 'INACTIVE'
}

type SuccessIdResponse = { success: true; id: string }

// ============ Query Hooks ============

/**
 * 获取组织的部门列表
 */
export function useDepartments(organizationId?: string) {
    return useQuery<Department[]>({
        queryKey: departmentQueryKeys.byOrg(organizationId ?? ''),
        queryFn: async () => {
            if (!organizationId) return []
            const result = await getDepartmentsFn({ data: { organizationId } })
            return result as Department[]
        },
        enabled: !!organizationId,
    })
}

/**
 * 获取部门树
 */
export function useDepartmentTree(organizationId?: string) {
    return useQuery<Department[]>({
        queryKey: departmentQueryKeys.tree(organizationId ?? ''),
        queryFn: async () => {
            if (!organizationId) return []
            const result = await getDepartmentTreeFn({ data: { organizationId } })
            return result as Department[]
        },
        enabled: !!organizationId,
    })
}

/**
 * 获取单个部门
 */
export function useDepartment(id?: string) {
    return useQuery<Department | null>({
        queryKey: departmentQueryKeys.detail(id ?? ''),
        queryFn: async () => {
            if (!id) return null
            const result = await getDepartmentFn({ data: { id } })
            return result as Department
        },
        enabled: !!id,
    })
}

/**
 * 获取下级部门
 */
export function useSubDepartments(departmentId?: string) {
    return useQuery<string[]>({
        queryKey: departmentQueryKeys.subDepts(departmentId ?? ''),
        queryFn: async () => {
            if (!departmentId) return []
            const result = await getSubDepartmentsFn({ data: { departmentId } })
            return result as string[]
        },
        enabled: !!departmentId,
    })
}

// ============ Mutation Hooks ============

/**
 * 创建部门
 */
export function useCreateDepartment() {
    const queryClient = useQueryClient()

    return useMutation<Department, Error, CreateDepartmentData>({
        mutationFn: async (data: CreateDepartmentData) => {
            const result = await createDepartmentFn({ data })
            return result as Department
        },
        onSuccess: (data) => {
            // 刷新该组织的部门列表和树
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.byOrg(data.organizationId)
            })
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.tree(data.organizationId)
            })
            // 如果有父部门，刷新父部门详情
            if (data.parentId) {
                queryClient.invalidateQueries({
                    queryKey: departmentQueryKeys.detail(data.parentId)
                })
            }
        },
    })
}

/**
 * 更新部门
 */
export function useUpdateDepartment() {
    const queryClient = useQueryClient()

    return useMutation<Department, Error, { id: string; data: UpdateDepartmentData }>({
        mutationFn: async ({ id, data }) => {
            const result = await updateDepartmentFn({ data: { id, ...data } })
            return result as Department
        },
        onSuccess: (data) => {
            // 刷新该组织的部门列表和树
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.byOrg(data.organizationId)
            })
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.tree(data.organizationId)
            })
            // 刷新部门详情
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.detail(data.id)
            })
            // 如果有父部门，刷新父部门详情
            if (data.parentId) {
                queryClient.invalidateQueries({
                    queryKey: departmentQueryKeys.detail(data.parentId)
                })
            }
        },
    })
}

/**
 * 删除部门
 */
export function useDeleteDepartment() {
    const queryClient = useQueryClient()

    return useMutation<SuccessIdResponse, Error, { id: string; organizationId: string }>({
        mutationFn: async ({ id }) => {
            const result = await deleteDepartmentFn({ data: { id } })
            return result
        },
        onSuccess: (_, variables) => {
            // 刷新该组织的部门列表和树
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.byOrg(variables.organizationId)
            })
            queryClient.invalidateQueries({
                queryKey: departmentQueryKeys.tree(variables.organizationId)
            })
        },
    })
}
