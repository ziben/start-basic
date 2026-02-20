import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import {
    createRuntimeConfigFn,
    deleteRuntimeConfigFn,
    getRuntimeConfigHistoryFn,
    listRuntimeConfigsFn,
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

export function useUpdateSystemConfig(): UseMutationResult<SystemConfig, Error, UpdateSystemConfigPayload> {
    const qc = useQueryClient()
    return useMutation<SystemConfig, Error, UpdateSystemConfigPayload>({
        mutationFn: async (payload) => {
            const result = await updateRuntimeConfigFn({ data: payload })
            return result as SystemConfig
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: runtimeConfigQueryKeys.all })
        },
    })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteSystemConfig(): UseMutationResult<{ success: true }, Error, { id: string }> {
    const qc = useQueryClient()
    return useMutation<{ success: true }, Error, { id: string }>({
        mutationFn: async (payload) => {
            const result = await deleteRuntimeConfigFn({ data: payload })
            return result as { success: true }
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: runtimeConfigQueryKeys.all })
        },
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
