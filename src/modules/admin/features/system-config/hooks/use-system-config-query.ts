import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import {
    createRuntimeConfigFn,
    deleteRuntimeConfigFn,
    getRuntimeConfigHistoryFn,
    listRuntimeConfigsFn,
    getPublicRuntimeConfigsFn,
    refreshRuntimeConfigFn,
    updateRuntimeConfigFn,
} from '../../../shared/server-fns/runtime-config.fn'
import { runtimeConfigQueryKeys } from '~/shared/lib/query-keys'
import type { SystemConfig, SystemConfigChange, ConfigValueType } from '../data/schema'

// ─── List ─────────────────────────────────────────────────────────────────────

export function useSystemConfigs(): UseQueryResult<SystemConfig[], Error> {
    return useQuery<SystemConfig[]>({
        queryKey: runtimeConfigQueryKeys.list(),
        queryFn: async () => {
            const result = await listRuntimeConfigsFn()
            return result as SystemConfig[]
        },
    })
}

export function usePublicConfigs(): UseQueryResult<SystemConfig[], Error> {
    return useQuery<SystemConfig[]>({
        queryKey: runtimeConfigQueryKeys.public(),
        queryFn: async () => {
            const result = await getPublicRuntimeConfigsFn()
            return result as SystemConfig[]
        },
    })
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateSystemConfigPayload = {
    key: string
    value: string
    category: string
    valueType: ConfigValueType
    isSecret?: boolean
    isPublic?: boolean
    isEnabled?: boolean
    description?: string | null
}

export function useCreateSystemConfig(): UseMutationResult<SystemConfig, Error, CreateSystemConfigPayload> {
    const qc = useQueryClient()
    return useMutation<SystemConfig, Error, CreateSystemConfigPayload>({
        mutationFn: async (payload) => {
            const result = await createRuntimeConfigFn({ data: payload })
            return result as SystemConfig
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: runtimeConfigQueryKeys.all })
        },
    })
}

// ─── History ──────────────────────────────────────────────────────────────────

export function useSystemConfigHistory(configId?: string): UseQueryResult<SystemConfigChange[], Error> {
    return useQuery<SystemConfigChange[]>({
        queryKey: runtimeConfigQueryKeys.history(configId ?? 'none'),
        enabled: Boolean(configId),
        queryFn: async () => {
            if (!configId) return []
            const result = await getRuntimeConfigHistoryFn({ data: { configId } })
            return result as SystemConfigChange[]
        },
    })
}

import { useSystemConfigsOptimisticUpdate, createSystemConfigUpdateFn, createSystemConfigDeleteFn } from './use-system-configs-optimistic-update'

// ─── Update ───────────────────────────────────────────────────────────────────

export type UpdateSystemConfigPayload = {
    id: string
    value: string
    valueType?: ConfigValueType
    isEnabled?: boolean
    isPublic?: boolean
    description?: string | null
    note?: string
}

export function useUpdateSystemConfig() {
    const qc = useQueryClient()
    const { getOptimisticMutationOptions } = useSystemConfigsOptimisticUpdate()

    return useMutation({
        mutationFn: async (payload: UpdateSystemConfigPayload) => {
            const result = await updateRuntimeConfigFn({ data: payload })
            return result as SystemConfig
        },
        ...getOptimisticMutationOptions({
            queryKey: runtimeConfigQueryKeys.all,
            updateFn: (configs, payload) => createSystemConfigUpdateFn(configs, payload),
        }),
    })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteSystemConfig() {
    const qc = useQueryClient()
    const { getOptimisticMutationOptions } = useSystemConfigsOptimisticUpdate()

    return useMutation({
        mutationFn: async (payload: { id: string }) => {
            const result = await deleteRuntimeConfigFn({ data: payload })
            return result as { success: true }
        },
        ...getOptimisticMutationOptions({
            queryKey: runtimeConfigQueryKeys.all,
            updateFn: (configs, payload) => createSystemConfigDeleteFn(configs, payload.id),
        }),
    })
}


// ─── Refresh ──────────────────────────────────────────────────────────────────

export function useRefreshSystemConfig(): UseMutationResult<{ success: true; refreshedAt: number }, Error, void> {
    const qc = useQueryClient()
    return useMutation<{ success: true; refreshedAt: number }, Error, void>({
        mutationFn: async () => {
            const result = await refreshRuntimeConfigFn()
            return result as { success: true; refreshedAt: number }
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: runtimeConfigQueryKeys.all })
        },
    })
}
