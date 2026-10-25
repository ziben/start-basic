import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushLogs,
  getLogQueueStats,
  writeAuditLog,
  writeSystemLog,
  redact,
  redactString,
} from './server-log-writer'

const mocks = vi.hoisted(() => ({
  systemCreateMany: vi.fn(),
  auditCreateMany: vi.fn(),
  appendFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('@/shared/lib/db', () => ({
  default: {
    systemLog: { createMany: mocks.systemCreateMany },
    auditLog: { createMany: mocks.auditCreateMany },
  },
}))
vi.mock('~/infrastructure/config/runtime-config', () => ({
  getRuntimeConfig: (key: string) => {
    if (key === 'log.dir') return 'test-logs'
    if (key === 'log.system.sampleRate') return 1
    if (key === 'log.system.sampleLevels') return [] as string[]
    return undefined
  },
}))
vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  appendFile: mocks.appendFile,
  default: { mkdir: mocks.mkdir, appendFile: mocks.appendFile },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  ;(globalThis as Record<string, unknown>).__logQueue = undefined
  mocks.mkdir.mockResolvedValue(undefined)
  mocks.appendFile.mockResolvedValue(undefined)
  mocks.systemCreateMany.mockResolvedValue({ count: 0 })
  mocks.auditCreateMany.mockResolvedValue({ count: 0 })
})

afterEach(() => {
  vi.useRealTimers()
})

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

describe('log queue fault boundaries', () => {
  it('re-queues failed batches and persists them in declared order after the database recovers', async () => {
    mocks.auditCreateMany.mockRejectedValueOnce(new Error('connection reset'))
    await writeAuditLog({ action: 'first', targetType: 'question' })
    await writeAuditLog({ action: 'second', targetType: 'question' })

    const failed = await flushLogs()
    expect(failed).toEqual({ remainingSystem: 0, remainingAudit: 2 })
    expect(getLogQueueStats().dbWriteFailures).toBeGreaterThanOrEqual(1)

    const recovered = await flushLogs()
    expect(recovered).toEqual({ remainingSystem: 0, remainingAudit: 0 })
    const batch = mocks.auditCreateMany.mock.calls.at(-1)?.[0]?.data as Array<{ action: string }>
    expect(batch.map((row) => row.action)).toEqual(['first', 'second'])
  })

  it('keeps the queue bounded and counts entries dropped on overflow', async () => {
    for (let i = 0; i < 5002; i += 1) {
      await writeAuditLog({ action: `action-${i}`, targetType: 'question' })
    }

    const stats = getLogQueueStats()
    expect(stats.pendingAudit).toBe(5000)
    expect(stats.droppedOverflow).toBe(2)
  })

  it('still queues for the database and exposes local JSONL write failures', async () => {
    mocks.appendFile.mockRejectedValue(new Error('ENOSPC: no space left on device'))

    await expect(writeAuditLog({ action: 'persisted', targetType: 'question' })).resolves.toBeUndefined()

    const stats = getLogQueueStats()
    expect(stats.localWriteFailures).toBe(1)
    expect(stats.pendingAudit).toBe(1)
  })

  it('reports unwritten entries on shutdown instead of claiming success during persistent failures', async () => {
    mocks.auditCreateMany.mockRejectedValue(new Error('connection refused'))
    mocks.systemCreateMany.mockRejectedValue(new Error('connection refused'))

    await writeAuditLog({ action: 'audit-1', targetType: 'question' })
    await writeAuditLog({ action: 'audit-2', targetType: 'question' })
    await writeSystemLog({ level: 'info', method: 'GET', path: '/health', status: 200, durationMs: 5 })

    const result = await flushLogs()
    expect(result).toEqual({ remainingSystem: 1, remainingAudit: 2 })
    expect(getLogQueueStats().dbWriteFailures).toBeGreaterThanOrEqual(2)
    expect(JSON.stringify(getLogQueueStats())).not.toContain('connection refused')
  })
})
