import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const publicKeys = [
  'VITE_APP_URL',
  'VITE_PC_HOMEPAGE_ROUTE',
  'VITE_MOBILE_HOMEPAGE_ROUTE',
  'VITE_APP_NAME',
  'VITE_APP_DESC',
  'VITE_ADMIN_APP_NAME',
  'VITE_ADMIN_APP_DESC',
] as const

beforeEach(() => {
  vi.resetModules()
  for (const key of publicKeys) vi.stubEnv(key, undefined)
})

afterEach(() => vi.unstubAllEnvs())

describe('public environment configuration', () => {
  it('keeps page defaults without requiring server configuration', async () => {
    vi.stubEnv('DATABASE_URL', undefined)
    vi.stubEnv('BETTER_AUTH_SECRET', undefined)
    const { env } = await import('./env')
    expect(env).toEqual({
      VITE_PC_HOMEPAGE_ROUTE: '/',
      VITE_MOBILE_HOMEPAGE_ROUTE: '/',
      VITE_APP_NAME: 'Zi Start',
      VITE_APP_DESC: 'Zi Start.',
    })
  })

  it('uses public overrides and excludes server and unlisted Vite variables', async () => {
    const overrides = {
      VITE_APP_URL: 'https://example.test',
      VITE_PC_HOMEPAGE_ROUTE: '/dashboard',
      VITE_MOBILE_HOMEPAGE_ROUTE: '/mobile',
      VITE_APP_NAME: 'Public app',
      VITE_APP_DESC: 'Public description',
      VITE_ADMIN_APP_NAME: 'Admin app',
      VITE_ADMIN_APP_DESC: 'Admin description',
    }
    for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value)
    vi.stubEnv('DATABASE_URL', 'postgresql://test:sentinel@localhost/test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'server-secret-sentinel')
    vi.stubEnv('APP_URL', 'https://server-only.test')
    vi.stubEnv('VITE_UNLISTED_VALUE', 'unlisted-sentinel')
    const { env } = await import('./env')
    expect(env).toEqual(overrides)
  })

  it('rejects an invalid public URL', async () => {
    vi.stubEnv('VITE_APP_URL', 'invalid-url')
    await expect(import('./env')).rejects.toThrow()
  })
})
