import { expect, it, vi } from 'vitest'
import { HealthReportService } from './health-report.service'

const db = vi.hoisted(() => ({ count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) }))
vi.mock('@/shared/lib/db', () => ({ default: { healthReport: db } }))

it('does not fetch OCR text for a bounded user-scoped list', async () => {
  await HealthReportService.listForUser('user-1', { page: 2, pageSize: 500 })
  const args = db.findMany.mock.calls[0][0]
  expect(args).toMatchObject({ where: { userId: 'user-1' }, skip: 50, take: 50 })
  expect(args.select.ocrText).toBeUndefined()
  expect(args.select._count).toEqual({ select: { metrics: true } })
  expect(args.include).toBeUndefined()
})
