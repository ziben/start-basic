import { describe, expect, it, vi } from 'vitest'
import { recordRequest, recordSlowQuery } from './metrics'

describe('operational metrics', () => {
  it('counts only 5xx as server errors and keeps slow query logs free of SQL', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      recordRequest(200, 12, 'GET')
      recordRequest(403, 3, 'POST')
      expect(recordRequest(500, 20, 'GET')).toMatchObject({ requests: 3, errors: 1, errorRate: 1 / 3 })
      expect(recordSlowQuery(199)).toBe(false)
      expect(recordSlowQuery(200)).toBe(true)
      expect(JSON.parse(warn.mock.calls[0][0])).toMatchObject({ event: 'slow_query', durationMs: 200 })
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      info.mockRestore()
      warn.mockRestore()
    }
  })
})
