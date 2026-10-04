import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import type { SystemConfig } from '../data/schema'
import type { UpdateSystemConfigPayload } from './use-system-config-query'

export function useSystemConfigsOptimisticUpdate() {
    return useOptimisticListUpdate<SystemConfig>()
}

export function createSystemConfigUpdateFn(configs: SystemConfig[], payload: UpdateSystemConfigPayload) {
    return configs.map((c) =>
        c.id === payload.id
            ? {
                ...c,
                value: payload.value,
                valueType: payload.valueType ?? c.valueType,
                isEnabled: payload.isEnabled ?? c.isEnabled,
                isPublic: payload.isPublic ?? c.isPublic,
                description: payload.description !== undefined ? payload.description : c.description,
                // note is not part of SystemConfig object returned
            }
            : c
    )
}

export function createSystemConfigDeleteFn(configs: SystemConfig[], id: string) {
    return configs.filter((c) => c.id !== id)
}
