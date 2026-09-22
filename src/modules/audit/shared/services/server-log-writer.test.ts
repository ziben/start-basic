import { describe, expect, it } from 'vitest'
import { redact, redactString } from './server-log-writer'

describe('audit log redaction', () => {
  it('redacts sensitive fields regardless of key casing and nested values', () => {
    expect(
      redact({
        Password: 'secret',
        WECHAT_PAY_API_V3_KEY: 'payment-key',
        nested: { access_token: 'token-value' },
        note: 'Bearer abc123 token=inline-secret',
      })
    ).toEqual({
      Password: '[REDACTED]',
      WECHAT_PAY_API_V3_KEY: '[REDACTED]',
      nested: { access_token: '[REDACTED]' },
      note: 'Bearer [REDACTED] token=[REDACTED]',
    })
  })

  it('removes private key material from string log fields', () => {
    expect(redactString('-----BEGIN PRIVATE KEY-----abc-----END PRIVATE KEY-----')).toBe('[REDACTED]')
  })
})
