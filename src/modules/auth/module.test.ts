import { describe, expect, it } from 'vitest'
import { authModule } from './module'
import { auth, getAuth } from './shared/lib/auth'

describe('authModule', () => {
  it('declares better-auth plugin ids and stable runtime exports', () => {
    expect(authModule.key).toBe('auth')
    expect(authModule.betterAuth?.serverPluginIds).toEqual([
      'bearer',
      'username',
      'organization',
      'admin',
      'wechat-oauth',
      'user-created-hooks',
    ])
    expect(authModule.betterAuth?.clientPluginIds).toEqual([
      'username',
      'admin',
      'organization',
      'wechat-oauth',
    ])
    const runtime = authModule.exports?.runtime as {
      auth: typeof auth
      getAuth: typeof getAuth
    }

    expect(runtime.auth).toBe(auth)
    expect(runtime.getAuth).toBe(getAuth)
  })
})
