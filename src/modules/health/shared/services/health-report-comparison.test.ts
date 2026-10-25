import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthReportService } from './health-report.service'

const db = vi.hoisted(() => ({ findMany: vi.fn() }))
vi.mock('@/shared/lib/db', () => ({ default: { healthReport: db } }))

function report(id: string, personId: string, metrics: Array<Record<string, unknown>>) {
  return {
    id,
    title: id,
    examDate: null,
    personId,
    person: { id: personId, name: '本人' },
    metrics,
  }
}

function metric(unit: string | null, valueText: string) {
  return {
    rawName: '血糖',
    valueText,
    numericValue: Number(valueText),
    unit,
    flag: 'NORMAL',
    metric: { code: 'glucose', name: '血糖' },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('compareForUser', () => {
  it('shows both results when the same metric uses the same unit', async () => {
    db.findMany.mockResolvedValue([
      report('left', 'person-1', [metric('mmol/L', '5.0')]),
      report('right', 'person-1', [metric('mmol/L', '5.6')]),
    ])

    const result = await HealthReportService.compareForUser('user-1', {
      leftReportId: 'left',
      rightReportId: 'right',
    })

    expect(result.metrics[0]).toMatchObject({
      code: 'glucose',
      comparable: true,
      left: { valueText: '5.0', unit: 'mmol/L' },
      right: { valueText: '5.6', unit: 'mmol/L' },
    })
  })

  it('keeps both original values and units when units differ', async () => {
    db.findMany.mockResolvedValue([
      report('left', 'person-1', [metric('mmol/L', '5.0')]),
      report('right', 'person-1', [metric('mg/dL', '90')]),
    ])

    const result = await HealthReportService.compareForUser('user-1', {
      leftReportId: 'left',
      rightReportId: 'right',
    })

    expect(result.metrics[0]).toMatchObject({
      comparable: false,
      left: { valueText: '5.0', unit: 'mmol/L' },
      right: { valueText: '90', unit: 'mg/dL' },
    })
  })

  it('keeps the existing side and marks the missing side as null', async () => {
    db.findMany.mockResolvedValue([
      report('left', 'person-1', [metric('mmol/L', '5.0')]),
      report('right', 'person-1', []),
    ])

    const result = await HealthReportService.compareForUser('user-1', {
      leftReportId: 'left',
      rightReportId: 'right',
    })

    expect(result.metrics[0]).toMatchObject({
      comparable: false,
      left: { valueText: '5.0', unit: 'mmol/L' },
      right: null,
    })
  })

  it('keeps values when only one side carries a unit', async () => {
    db.findMany.mockResolvedValue([
      report('left', 'person-1', [metric(null, '阳性')]),
      report('right', 'person-1', [metric('mmol/L', '5.6')]),
    ])

    const result = await HealthReportService.compareForUser('user-1', {
      leftReportId: 'left',
      rightReportId: 'right',
    })

    expect(result.metrics[0]).toMatchObject({
      comparable: false,
      left: { valueText: '阳性', unit: null },
      right: { valueText: '5.6', unit: 'mmol/L' },
    })
  })

  it('rejects reports that do not both belong to the requesting user', async () => {
    db.findMany.mockResolvedValue([report('left', 'person-1', [metric('mmol/L', '5.0')])])

    await expect(
      HealthReportService.compareForUser('user-1', { leftReportId: 'left', rightReportId: 'other-users-report' })
    ).rejects.toThrow('体检报告不存在')
  })

  it('rejects comparing reports of different persons', async () => {
    db.findMany.mockResolvedValue([
      report('left', 'person-1', [metric('mmol/L', '5.0')]),
      report('right', 'person-2', [metric('mmol/L', '5.6')]),
    ])

    await expect(
      HealthReportService.compareForUser('user-1', { leftReportId: 'left', rightReportId: 'right' })
    ).rejects.toThrow('只能比较同一人员的体检报告')
  })
})
