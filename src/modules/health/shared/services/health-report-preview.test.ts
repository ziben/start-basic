import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthReportService } from './health-report.service'

const db = vi.hoisted(() => ({
  healthReport: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  healthPerson: { findFirst: vi.fn() },
  healthMetricResult: { create: vi.fn() },
  healthMetricCatalog: { upsert: vi.fn() },
  $transaction: vi.fn(),
}))
vi.mock('@/shared/lib/db', () => ({ default: db }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('previewForUser', () => {
  it('parses metrics and skipped lines without touching the database', async () => {
    const result = await HealthReportService.previewForUser({
      ocrText: '白细胞 6.21 10^9/L 3.5-9.5 正常\n报告日期：2026-10-01\n体检结论：未见明显异常',
    })

    expect(result.metricCount).toBe(1)
    expect(result.metrics[0]).toMatchObject({ rawName: '白细胞', valueText: '6.21', unit: '10^9/L' })
    expect(result.skippedLines).toEqual([
      { rawLine: '报告日期：2026-10-01', reason: '非指标行' },
      { rawLine: '体检结论：未见明显异常', reason: '无法识别数值' },
    ])

    expect(db.$transaction).not.toHaveBeenCalled()
    expect(db.healthReport.create).not.toHaveBeenCalled()
    expect(db.healthMetricResult.create).not.toHaveBeenCalled()
  })

  it('returns an empty preview for text without any parsable metric', async () => {
    const result = await HealthReportService.previewForUser({ ocrText: '只是一段普通文字' })

    expect(result.metricCount).toBe(0)
    expect(result.metrics).toEqual([])
    expect(db.healthReport.create).not.toHaveBeenCalled()
  })
})

describe('createFromManualText', () => {
  it('still rejects manual text that yields no metrics', async () => {
    await expect(
      HealthReportService.createFromManualText('user-1', {
        title: '报告',
        personId: 'person-1',
        ocrText: '没有指标的一行',
      })
    ).rejects.toThrow('未能从 OCR 文本中解析出体检指标')

    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
