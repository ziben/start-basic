import { describe, expect, it } from 'vitest'
import { checkReadiness, readinessResponse } from './health-check'

describe('readiness checks', () => {
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
})
