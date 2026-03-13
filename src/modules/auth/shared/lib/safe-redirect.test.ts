import { describe, expect, it } from 'vitest'
import { resolveRedirectTarget, sanitizeRedirectTarget } from './safe-redirect'

describe('safe redirect helpers', () => {
  it('keeps relative in-app redirects', () => {
    expect(sanitizeRedirectTarget('/dashboard?tab=profile#security')).toBe('/dashboard?tab=profile#security')
  })

  it('rejects external redirects', () => {
    expect(sanitizeRedirectTarget('https://evil.example/login')).toBeUndefined()
    expect(sanitizeRedirectTarget('//evil.example/login')).toBeUndefined()
  })

  it('rejects non-path values', () => {
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeRedirectTarget('dashboard')).toBeUndefined()
  })

  it('falls back when redirect is unsafe', () => {
    expect(resolveRedirectTarget('https://evil.example', '/dashboard')).toBe('/dashboard')
  })
})
