import prisma from '@/shared/lib/db'
import type { Prisma } from '~/generated/prisma/client'
import { ManualTextOcrProvider } from '../ocr/manual-text-ocr-provider'
import {
  parseHealthReportText,
  parseHealthReportTextDetailed,
  type ParsedHealthMetric,
  type ParsedHealthMetricFlag,
  type SkippedLine,
} from '../ocr/parse-health-report-text'

export interface CreateHealthReportInput {
  readonly title: string
  readonly personId: string
  readonly examDate?: string
  readonly sourceFileName?: string
  readonly ocrText: string
}

export interface PreviewHealthReportInput {
  readonly ocrText: string
  readonly sourceFileName?: string
  readonly personId?: string
  readonly examDate?: string
}

export interface HealthReportPreviewMetric {
  readonly rawLine: string
  readonly rawName: string
  readonly valueText: string
  readonly unit?: string
  readonly referenceRange?: string
  readonly flag: ParsedHealthMetricFlag
}

export interface HealthReportPreview {
  readonly metricCount: number
  readonly metrics: HealthReportPreviewMetric[]
  readonly skippedLines: SkippedLine[]
}

export interface ListHealthReportsInput {
  readonly page?: number
  readonly pageSize?: number
  readonly filter?: string
  readonly personId?: string
}

export interface HealthReportListItem {
  readonly id: string
  readonly title: string
  readonly examDate: Date | null
  readonly sourceFileName: string | null
  readonly person: { readonly id: string; readonly name: string } | null
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
    person: true
    metrics: {
      include: {
        metric: true
      }
    }
  }
}>

export const HealthReportService = {
  /** 入库前的纯解析预览：只读 OCR 文本，不做任何数据库读写 */
  async previewForUser(input: PreviewHealthReportInput): Promise<HealthReportPreview> {
    const ocrResult = await defaultOcrProvider.extractText({
      text: input.ocrText,
      sourceFileName: input.sourceFileName,
    })
    const { metrics, skippedLines } = parseHealthReportTextDetailed(ocrResult.text)

    return {
      metricCount: metrics.length,
      metrics: metrics.map((metric) => ({
        rawLine: metric.rawLine,
        rawName: metric.rawName,
        valueText: metric.valueText,
        unit: metric.unit,
        referenceRange: metric.referenceRange,
        flag: metric.flag,
      })),
      skippedLines,
    }
  },
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
      const person = await tx.healthPerson.findFirst({
        where: { id: input.personId, ownerUserId: userId },
        select: { id: true },
      })
      if (!person) throw new Error('健康档案人员不存在')

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
    const where = buildReportWhere(userId, filter, input.personId)

    const [total, reports] = await Promise.all([
      prisma.healthReport.count({ where }),
      prisma.healthReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          examDate: true,
          sourceFileName: true,
          person: { select: { id: true, name: true } },
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { metrics: true } },
        },
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

  async compareForUser(userId: string, input: CompareHealthReportsInput) {
    const reports = await prisma.healthReport.findMany({
      where: { userId, id: { in: [input.leftReportId, input.rightReportId] } },
      include: {
        person: { select: { id: true, name: true } },
        metrics: { orderBy: { orderIndex: 'asc' }, include: { metric: true } },
      },
    })

    if (reports.length !== 2) throw new Error('体检报告不存在')
    const left = reports.find((report) => report.id === input.leftReportId)
    const right = reports.find((report) => report.id === input.rightReportId)
    if (!left || !right) throw new Error('体检报告不存在')
    if (!left.personId || left.personId !== right.personId) {
      throw new Error('只能比较同一人员的体检报告')
    }

    const codes = new Set([...left.metrics, ...right.metrics].map((metric) => metric.metric?.code ?? metric.rawName))
    const leftByCode = new Map(left.metrics.map((metric) => [metric.metric?.code ?? metric.rawName, metric]))
    const rightByCode = new Map(right.metrics.map((metric) => [metric.metric?.code ?? metric.rawName, metric]))

    return {
      person: left.person,
      leftReport: { id: left.id, title: left.title, examDate: left.examDate },
      rightReport: { id: right.id, title: right.title, examDate: right.examDate },
      metrics: [...codes].map((code) => {
        const leftMetric = leftByCode.get(code)
        const rightMetric = rightByCode.get(code)
        return {
          code,
          name:
            leftMetric?.metric?.name ??
            rightMetric?.metric?.name ??
            leftMetric?.rawName ??
            rightMetric?.rawName ??
            code,
          unit: leftMetric?.unit ?? rightMetric?.unit ?? null,
          comparable: compatibleUnits(leftMetric?.unit, rightMetric?.unit),
          left: toMetricSide(leftMetric),
          right: toMetricSide(rightMetric),
        }
      }),
    }
  },
}

export interface CompareHealthReportsInput {
  readonly leftReportId: string
  readonly rightReportId: string
}

function buildReportData(
  userId: string,
  input: CreateHealthReportInput,
  ocrText: string,
  sourceFileName?: string
): Prisma.HealthReportCreateInput {
  return {
    user: { connect: { id: userId } },
    person: { connect: { id: input.personId } },
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

function buildReportWhere(userId: string, filter: string, personId?: string): Prisma.HealthReportWhereInput {
  const q = filter.trim()
  return {
    userId,
    ...(personId ? { personId } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { sourceFileName: { contains: q } }] } : {}),
  }
}

function toListItem(report: {
  id: string
  title: string
  examDate: Date | null
  sourceFileName: string | null
  person: { id: string; name: string } | null
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
    person: report.person,
    status: report.status,
    metricCount: report._count.metrics,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }
}

function toMetricSide(
  metric:
    | {
        valueText: string
        numericValue: number | null
        unit: string | null
        flag: string
      }
    | undefined
) {
  if (!metric) return null
  return {
    valueText: metric.valueText,
    numericValue: metric.numericValue,
    unit: metric.unit,
    flag: metric.flag,
  }
}

function compatibleUnits(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return !left && !right
  return left.replace(/\s+/g, '').toLowerCase() === right.replace(/\s+/g, '').toLowerCase()
}

async function createMetricRows(
  tx: Prisma.TransactionClient,
  reportId: string,
  metrics: ParsedHealthMetric[]
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
  metric: ParsedHealthMetric
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
  client: Pick<Prisma.TransactionClient, 'healthReport'>
): Promise<HealthReportWithMetrics> {
  const report = await client.healthReport.findFirst({
    where: { id: reportId, userId },
    include: {
      person: true,
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
