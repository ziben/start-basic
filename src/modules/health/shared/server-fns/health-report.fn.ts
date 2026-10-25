import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '~/modules/auth/shared/lib/require-auth'

const CreateHealthReportSchema = z.object({
  title: z.string().trim().min(1, '报告标题不能为空'),
  personId: z.string().trim().min(1, '请选择健康档案人员'),
  examDate: z.string().optional(),
  sourceFileName: z.string().optional(),
  ocrText: z.string().trim().min(1, 'OCR 文本不能为空'),
})

const PreviewHealthReportSchema = z.object({
  ocrText: z.string().trim().min(1, 'OCR 文本不能为空').max(20000, 'OCR 文本过长，请分批录入'),
  sourceFileName: z.string().optional(),
  personId: z.string().trim().min(1).optional(),
  examDate: z.string().optional(),
})

const ListHealthReportsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(50).optional(),
  filter: z.string().optional(),
  personId: z.string().trim().min(1).optional(),
})

const CompareHealthReportsSchema = z.object({
  leftReportId: z.string().min(1),
  rightReportId: z.string().min(1),
})

async function requireUserId(): Promise<string> {
  return (await requireUser()).id
}

export const createHealthReportFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateHealthReportSchema>) => CreateHealthReportSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.createFromManualText(userId, data)
  })

export const previewHealthReportFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof PreviewHealthReportSchema>) => PreviewHealthReportSchema.parse(data))
  .handler(async ({ data }) => {
    await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.previewForUser(data)
  })

export const listHealthReportsFn = createServerFn({ method: 'GET' })
  .validator(ListHealthReportsSchema.optional().default({}))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.listForUser(userId, data)
  })

export const getHealthReportFn = createServerFn({ method: 'GET' })
  .validator(z.object({ reportId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.getByIdForUser(data.reportId, userId)
  })

export const compareHealthReportsFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof CompareHealthReportsSchema>) => CompareHealthReportsSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.compareForUser(userId, data)
  })
