import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auth } from '~/modules/auth/shared/lib/auth'

const CreateHealthReportSchema = z.object({
  title: z.string().trim().min(1, '报告标题不能为空'),
  examDate: z.string().optional(),
  sourceFileName: z.string().optional(),
  ocrText: z.string().trim().min(1, 'OCR 文本不能为空'),
})

const ListHealthReportsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(50).optional(),
  filter: z.string().optional(),
})

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })

  if (!session?.user?.id) {
    throw new Error('未登录')
  }

  return session.user.id
}

export const createHealthReportFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateHealthReportSchema>) =>
    CreateHealthReportSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.createFromManualText(userId, data)
  })

export const listHealthReportsFn = createServerFn({ method: 'GET' })
  .validator((data?: z.infer<typeof ListHealthReportsSchema>) =>
    data ? ListHealthReportsSchema.parse(data) : {},
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.listForUser(userId, data)
  })

export const getHealthReportFn = createServerFn({ method: 'GET' })
  .validator((data: { reportId: string }) => {
    if (!data?.reportId) throw new Error('报告 ID 不能为空')
    return data
  })
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthReportService } = await import('../services/health-report.service')
    return HealthReportService.getByIdForUser(data.reportId, userId)
  })
