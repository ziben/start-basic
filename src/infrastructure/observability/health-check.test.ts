import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkReadiness, readinessResponse } from './health-check'

describe('readiness checks', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports a ready service when the database is reachable and optional dependencies are disabled', async () => {
    const report = await checkReadiness({
      env: { ENABLE_AI: 'false' },
      databaseCheck: async () => {},
    })

    expect(report.status).toBe('ready')
    expect(report.dependencies.database.status).toBe('ok')
    expect(report.dependencies.cache.status).toBe('skipped')
    expect(report.dependencies.ai.status).toBe('skipped')
    expect(report.dependencies.payment.status).toBe('skipped')
    expect((await readinessResponse({ env: { ENABLE_AI: 'false' }, databaseCheck: async () => {} })).status).toBe(200)
  })

  it('returns not_ready for unavailable database or incomplete configured dependencies', async () => {
    const report = await checkReadiness({
      env: {
        ENABLE_AI: 'true',
        AI_PROVIDER: 'openai',
        WECHAT_PAY_MCH_ID: 'mch-1',
      },
      databaseCheck: async () => {
        throw new Error('connection string must not reach the response')
      },
    })

    expect(report.status).toBe('not_ready')
    expect(report.dependencies.database).toMatchObject({ status: 'degraded', details: 'unavailable' })
    expect(report.dependencies.ai).toMatchObject({ status: 'degraded', details: 'missing: OPENAI_API_KEY' })
    expect(report.dependencies.payment.status).toBe('degraded')
    expect(
      (
        await readinessResponse({
          env: { ENABLE_AI: 'true' },
          databaseCheck: async () => {
            throw new Error()
          },
        })
      ).status
    ).toBe(503)
  })

  it('probes configured AI and Upstash dependencies without exposing credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const report = await checkReadiness({
      env: {
        ENABLE_AI: 'true',
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'secret-key',
        UPSTASH_REDIS_REST_URL: 'https://cache.example.com',
        UPSTASH_REDIS_REST_TOKEN: 'secret-token',
      },
      databaseCheck: async () => {},
    })

    expect(report.status).toBe('ready')
    expect(report.dependencies.ai.status).toBe('ok')
    expect(report.dependencies.cache.status).toBe('ok')
    expect(JSON.stringify(report)).not.toContain('secret')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
