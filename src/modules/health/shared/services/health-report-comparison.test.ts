import { expect, it, vi } from 'vitest'
import { HealthReportService } from './health-report.service'

const db = vi.hoisted(() => ({ findMany: vi.fn() }))
vi.mock('@/shared/lib/db', () => ({ default: { healthReport: db } }))

it('compares same-person metrics and leaves incompatible units empty', async () => {
  db.findMany.mockResolvedValue([
    {
      id: 'left',
      title: '2025',
      examDate: null,
      personId: 'person-1',
      person: { id: 'person-1', name: '本人' },
      metrics: [
        {
          rawName: '血糖',
          valueText: '5.0',
          numericValue: 5,
          unit: 'mmol/L',
          flag: 'NORMAL',
          metric: { code: 'glucose', name: '血糖' },
        },
      ],
    },
    {
      id: 'right',
      title: '2026',
      examDate: null,
      personId: 'person-1',
      person: { id: 'person-1', name: '本人' },
      metrics: [
        {
          rawName: '血糖',
          valueText: '90',
          numericValue: 90,
          unit: 'mg/dL',
          flag: 'NORMAL',
          metric: { code: 'glucose', name: '血糖' },
        },
      ],
    },
  ])

  const result = await HealthReportService.compareForUser('user-1', {
    leftReportId: 'left',
    rightReportId: 'right',
  })

  expect(result.metrics[0]).toMatchObject({ code: 'glucose', left: null, right: null })
})
