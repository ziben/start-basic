import { createRuntimeConfigStore } from './runtime-config-store'
import type { RuntimeConfigKey, RuntimeConfigShape } from './runtime-config-defaults'

const runtimeConfigStore = createRuntimeConfigStore()

export async function initRuntimeConfig(options?: { force?: boolean }): Promise<void> {
  await runtimeConfigStore.load(options)
}

export function getRuntimeConfig<K extends RuntimeConfigKey>(key: K): RuntimeConfigShape[K] {
  return runtimeConfigStore.get(key)
}

export async function refreshRuntimeConfig(): Promise<{ refreshedAt: number }> {
  return runtimeConfigStore.refresh()
}

export function getPublicRuntimeConfig(): Pick<
  RuntimeConfigShape,
  'ai.enabled' | 'ai.provider' | 'ai.model' | 'ai.systemPrompt'
> {
  return {
    'ai.enabled': getRuntimeConfig('ai.enabled'),
    'ai.provider': getRuntimeConfig('ai.provider'),
    'ai.model': getRuntimeConfig('ai.model'),
    'ai.systemPrompt': getRuntimeConfig('ai.systemPrompt'),
  }
}

export type { RuntimeConfigKey, RuntimeConfigShape }
