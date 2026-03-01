/**
 * Organization API Hooks - React Query 封装
 *
 * [迁移自 admin/shared/hooks/use-admin-organization-api.ts]
 * 使用 ServerFn 替代 REST API 调用
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getOrganizationsFn,
    getOrganizationFn,
    createOrganizationFn,
    updateOrganizationFn,
    deleteOrganizationFn,
    bulkDeleteOrganizationsFn,
} from '../server-fns/organization.fn'
import type { AdminOrganizationInfo } from '../types/organization'
import { organizationQueryKeys } from '~/shared/lib/query-keys'

export type { AdminOrganizationInfo }

export type AdminOrganizationsPage = {
    items: AdminOrganizationInfo[]
    total: number
    pageCount: number
}

// ============ Query Hooks ============

export function useAdminOrganizations(params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: string
}) {
    return useQuery({
        queryKey: organizationQueryKeys.list(params),
        queryFn: async () => {
            const result = await getOrganizationsFn({
                data: params as { sortDir?: 'asc' | 'desc' } | undefined,
            })
            return result as AdminOrganizationsPage
        },
        placeholderData: keepPreviousData,
    })
}

export function useAdminOrganization(id: string) {
    return useQuery({
        queryKey: organizationQueryKeys.detail(id),
        queryFn: async () => {
            const result = await getOrganizationFn({ data: { id } })
            return result as AdminOrganizationInfo
        },
        enabled: !!id,
    })
}

// ============ Mutation Hooks ============

export function useCreateAdminOrganization() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { name: string; slug?: string; logo?: string; metadata?: string }) => {
            const result = await createOrganizationFn({ data })
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
        },
    })
}

export function useUpdateAdminOrganization() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string
            data: { name?: string; slug?: string; logo?: string; metadata?: string }
        }) => {
            const result = await updateOrganizationFn({ data: { id, ...data } })
            return result
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
            queryClient.invalidateQueries({ queryKey: organizationQueryKeys.detail(id) })
        },
    })
}

export function useDeleteAdminOrganization() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteOrganizationFn({ data: { id } })
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
        },
    })
}

export function useBulkDeleteAdminOrganizations() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { ids: string[] }) => {
            const result = await bulkDeleteOrganizationsFn({ data })
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
        },
    })
}
