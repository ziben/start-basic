import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import {
  getRuntimeConfigHistoryFn,
  listRuntimeConfigsFn,
  refreshRuntimeConfigFn,
  updateRuntimeConfigFn,
} from '../server-fns/runtime-config.fn'
import type { AdminRuntimeConfig, AdminRuntimeConfigChange, ConfigValueType } from '../types/runtime-config'
import { runtimeConfigQueryKeys } from '~/shared/lib/query-keys'

export function useRuntimeConfigs(): UseQueryResult<AdminRuntimeConfig[], Error> {
  return useQuery<AdminRuntimeConfig[]>({
    queryKey: runtimeConfigQueryKeys.list(),
    queryFn: async () => {
      const result = await listRuntimeConfigsFn()
      return result as AdminRuntimeConfig[]
    },
  })
}

export function useRuntimeConfigHistory(configId?: string): UseQueryResult<AdminRuntimeConfigChange[], Error> {
  return useQuery<AdminRuntimeConfigChange[]>({
    queryKey: runtimeConfigQueryKeys.history(configId ?? 'none'),
    enabled: Boolean(configId),
    queryFn: async () => {
      if (!configId) return []
      const result = await getRuntimeConfigHistoryFn({ data: { configId } })
      return result as AdminRuntimeConfigChange[]
    },
  })
}

type UpdateRuntimeConfigPayload = {
  id: string
  value: string
  valueType?: ConfigValueType
  isEnabled?: boolean
  isPublic?: boolean
  description?: string | null
  note?: string
}

export function useUpdateRuntimeConfig(): UseMutationResult<AdminRuntimeConfig, Error, UpdateRuntimeConfigPayload> {
  const qc = useQueryClient()
  return useMutation<
    AdminRuntimeConfig,
    Error,
    UpdateRuntimeConfigPayload
  >({
    mutationFn: async (payload) => {
      const result = await updateRuntimeConfigFn({ data: payload })
      return result as AdminRuntimeConfig
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: runtimeConfigQueryKeys.all })
    },
  })
}

export function useRefreshRuntimeConfig(): UseMutationResult<{ success: true; refreshedAt: number }, Error, void> {
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
