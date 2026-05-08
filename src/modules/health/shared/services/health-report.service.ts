import prisma from '@/shared/lib/db'
import type { Prisma } from '~/generated/prisma/client'
import { ManualTextOcrProvider } from '../ocr/manual-text-ocr-provider'
import { parseHealthReportText, type ParsedHealthMetric } from '../ocr/parse-health-report-text'

export interface CreateHealthReportInput {
  readonly title: string
  readonly examDate?: string
  readonly sourceFileName?: string
  readonly ocrText: string
}

export interface ListHealthReportsInput {
  readonly page?: number
  readonly pageSize?: number
  readonly filter?: string
}

export interface HealthReportListItem {
  readonly id: string
  readonly title: string
  readonly examDate: Date | null
  readonly sourceFileName: string | null
  readonly status: string
  readonly metricCount: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

const defaultOcrProvider = new ManualTextOcrProvider()
const defaultPage = 1
const defaultPageSize = 10
const maxPageSize = 50
type HealthMetricCatalogEntity = Prisma.HealthMetricCatalogGetPayload<Record<string, never>>
type HealthReportWithMetrics = Prisma.HealthReportGetPayload<{
  include: {
    metrics: {
      include: {
        metric: true
      }
    }
  }
}>

export const HealthReportService = {
  async createFromManualText(userId: string, input: CreateHealthReportInput) {
    const ocrResult = await defaultOcrProvider.extractText({
      text: input.ocrText,
      sourceFileName: input.sourceFileName,
    })
    const metrics = parseHealthReportText(ocrResult.text)

    if (metrics.length === 0) {
      throw new Error('未能从 OCR 文本中解析出体检指标')
    }

    return prisma.$transaction(async (tx) => {
      const report = await tx.healthReport.create({
        data: buildReportData(userId, input, ocrResult.text, ocrResult.sourceFileName),
      })

      await createMetricRows(tx, report.id, metrics)
      return getReportByIdForUser(report.id, userId, tx)
    })
  },

  async listForUser(userId: string, input: ListHealthReportsInput = {}) {
    const page = normalizePage(input.page)
    const pageSize = normalizePageSize(input.pageSize)
    const filter = input.filter ?? ''
    const where = buildReportWhere(userId, filter)

    const [total, reports] = await Promise.all([
      prisma.healthReport.count({ where }),
      prisma.healthReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { metrics: true } } },
      }),
    ])

    return {
      items: reports.map(toListItem),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    }
  },

  async getByIdForUser(reportId: string, userId: string) {
    return getReportByIdForUser(reportId, userId, prisma)
  },
}

function buildReportData(
  userId: string,
  input: CreateHealthReportInput,
  ocrText: string,
  sourceFileName?: string,
): Prisma.HealthReportCreateInput {
  return {
    user: { connect: { id: userId } },
    title: input.title.trim(),
    examDate: parseExamDate(input.examDate),
    sourceFileName,
    ocrText,
    status: 'PARSED',
  }
}

function normalizePage(page?: number): number {
  return Number.isInteger(page) && page && page > 0 ? page : defaultPage
}

function normalizePageSize(pageSize?: number): number {
  if (!Number.isInteger(pageSize) || !pageSize || pageSize < 1) return defaultPageSize
  return Math.min(pageSize, maxPageSize)
}

function parseExamDate(examDate?: string): Date | undefined {
  if (!examDate) return undefined

  const parsed = new Date(examDate)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('体检日期格式不正确')
  }

  return parsed
}

function buildReportWhere(userId: string, filter: string): Prisma.HealthReportWhereInput {
  const q = filter.trim()
  return {
    userId,
    ...(q ? { OR: [{ title: { contains: q } }, { sourceFileName: { contains: q } }] } : {}),
  }
}

function toListItem(report: {
  id: string
  title: string
  examDate: Date | null
  sourceFileName: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  _count: { metrics: number }
}): HealthReportListItem {
  return {
    id: report.id,
    title: report.title,
    examDate: report.examDate,
    sourceFileName: report.sourceFileName,
    status: report.status,
    metricCount: report._count.metrics,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }
}

async function createMetricRows(
  tx: Prisma.TransactionClient,
  reportId: string,
  metrics: ParsedHealthMetric[],
): Promise<void> {
  for (const metric of metrics) {
    const catalog = await upsertCatalog(tx, metric)
    await tx.healthMetricResult.create({
      data: {
        reportId,
        metricId: catalog.id,
        rawName: metric.rawName,
        valueText: metric.valueText,
        numericValue: metric.numericValue,
        unit: metric.unit,
        referenceRange: metric.referenceRange,
        flag: metric.flag,
        rawLine: metric.rawLine,
        orderIndex: metric.orderIndex,
      },
    })
  }
}

async function upsertCatalog(
  tx: Prisma.TransactionClient,
  metric: ParsedHealthMetric,
): Promise<HealthMetricCatalogEntity> {
  return tx.healthMetricCatalog.upsert({
    where: { code: metricCode(metric.rawName) },
    update: {
      name: metric.rawName,
      defaultUnit: metric.unit,
    },
    create: {
      code: metricCode(metric.rawName),
      name: metric.rawName,
      defaultUnit: metric.unit,
      aliases: [metric.rawName],
    },
  })
}

function metricCode(rawName: string): string {
  return rawName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
}

async function getReportByIdForUser(
  reportId: string,
  userId: string,
  client: Pick<Prisma.TransactionClient, 'healthReport'>,
): Promise<HealthReportWithMetrics> {
  const report = await client.healthReport.findFirst({
    where: { id: reportId, userId },
    include: {
      metrics: {
        orderBy: { orderIndex: 'asc' },
        include: { metric: true },
      },
    },
  })

  if (!report) {
    throw new Error('体检报告不存在')
  }

  return report
}
