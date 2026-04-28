import { describe, expect, it, vi } from 'vitest'
import { getRuntimeConfig as getSharedRuntimeConfig } from '~/shared/config/runtime-config'
import { buildRuntimeConfigDefaults, normalizeRuntimeConfigValue } from './runtime-config-defaults'
import { createRuntimeConfigStore } from './runtime-config-store'

describe('runtime-config defaults', () => {
  it('builds defaults from env', () => {
    const defaults = buildRuntimeConfigDefaults({
      AI_PROVIDER: 'openai',
      ENABLE_AI: 'true',
      LOG_DIR: 'custom-logs',
    } as NodeJS.ProcessEnv)

    expect(defaults['ai.provider']).toBe('openai')
    expect(defaults['ai.enabled']).toBe(true)
    expect(defaults['log.dir']).toBe('custom-logs')
  })

  it('normalizes string array values', () => {
    const defaults = buildRuntimeConfigDefaults({} as NodeJS.ProcessEnv)
    const value = normalizeRuntimeConfigValue(
      'auth.trustedOrigins',
      'https://a.com, https://b.com',
      defaults,
    )

    expect(value).toEqual(['https://a.com', 'https://b.com'])
  })
})

describe('runtime-config store', () => {
  it('uses database values to override defaults', async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      { key: 'ai.model', value: '"gpt-5.4-mini"' },
      { key: 'auth.trustedOrigins', value: '["https://app.example.com"]' },
    ])

    const store = createRuntimeConfigStore({
      env: {} as NodeJS.ProcessEnv,
      getDb: async () => ({ $queryRaw: queryRaw }),
      now: () => 1,
    })

    await store.load()

    expect(store.get('ai.model')).toBe('gpt-5.4-mini')
    expect(store.get('auth.trustedOrigins')).toEqual(['https://app.example.com'])
  })

  it('falls back to defaults when db read fails', async () => {
    const store = createRuntimeConfigStore({
      env: { AI_PROVIDER: 'gemini' } as NodeJS.ProcessEnv,
      getDb: async () => {
        throw new Error('table missing')
      },
      now: () => 2,
      warn: vi.fn(),
    })

    await store.load()

    expect(store.get('ai.provider')).toBe('gemini')
  })
})

describe('runtime-config compatibility shim', () => {
  it('re-exports getRuntimeConfig from infrastructure entry', () => {
    expect(typeof getSharedRuntimeConfig).toBe('function')
  })
})
