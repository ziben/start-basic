import { questionContentSchema, type QuestionContent } from './domain'

export type ImportIssue = { row: number; message: string }
export type ParsedImport = {
  totalCount: number
  valid: { row: number; content: QuestionContent }[]
  errors: ImportIssue[]
}

export function parseCsv(source: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let closedQuote = false
  const text = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        quoted = false
        closedQuote = true
      } else field += char
      continue
    }
    if (closedQuote && char !== ',' && char !== '\n') throw new Error('CSV 引号结束后只能出现逗号或换行')
    if (char === '"') {
      if (field) throw new Error('CSV 字段中的引号必须转义')
      quoted = true
    } else if (char === ',' || char === '\n') {
      row.push(field)
      field = ''
      closedQuote = false
      if (char === '\n') {
        rows.push(row)
        row = []
      }
    } else field += char
  }
  if (quoted) throw new Error('CSV 存在未闭合的引号')
  if (field || row.length || closedQuote) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim()))
}

function csvRecord(cells: string[], headers: string[]): Record<string, unknown> {
  if (cells.length !== headers.length) throw new Error(`列数不匹配，应为 ${headers.length} 列`)
  const data: Record<string, unknown> = Object.fromEntries(headers.map((header, index) => [header, cells[index]]))
  data.difficulty = data.difficulty ? Number(data.difficulty) : 3
  data.knowledgePoints =
    typeof data.knowledgePoints === 'string'
      ? data.knowledgePoints
          .split('|')
          .map((name) => name.trim())
          .filter(Boolean)
      : []
  data.options = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((key) =>
    data[`option${key}`] ? [{ key, text: data[`option${key}`] }] : []
  )
  data.children = data.children ? JSON.parse(String(data.children)) : []
  return data
}

export function parseQuestionImport(source: string, format: 'csv' | 'json'): ParsedImport {
  const text = source.replace(/^\uFEFF/, '')
  let records: { row: number; value: unknown; error?: string }[]
  if (format === 'json') {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('JSON 格式错误，请检查括号、引号及逗号')
    }
    const values: unknown = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && 'questions' in parsed
        ? parsed.questions
        : null
    if (!Array.isArray(values)) throw new Error('JSON 顶层必须为题目数组，或包含 questions 数组的对象')
    records = values.map((value, index) => ({ row: index + 1, value }))
  } else {
    const [rawHeaders, ...rows] = parseCsv(text)
    if (!rawHeaders) throw new Error('CSV 文件为空')
    const headers = rawHeaders.map((header) => header.trim())
    if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
      throw new Error('CSV 表头不能为空或重复')
    }
    const allowed = new Set([
      'type',
      'stem',
      'answer',
      'explanation',
      'stage',
      'grade',
      'subject',
      'difficulty',
      'textbook',
      'chapter',
      'knowledgePoints',
      'source',
      'usageRights',
      'children',
      ...['A', 'B', 'C', 'D', 'E', 'F'].map((key) => `option${key}`),
    ])
    if (headers.some((header) => !allowed.has(header))) throw new Error('CSV 存在未知列，请使用下载的模板')
    for (const required of ['type', 'stem', 'stage', 'subject']) {
      if (!headers.includes(required)) throw new Error(`CSV 缺少必需列：${required}`)
    }
    records = rows.map((cells, index) => {
      try {
        return { row: index + 2, value: csvRecord(cells, headers) }
      } catch (error) {
        return { row: index + 2, value: null, error: error instanceof Error ? error.message : '数据格式错误' }
      }
    })
  }
  if (!records.length) throw new Error('文件中没有题目')
  if (records.length > 200) throw new Error('每次最多导入 200 道题目，请拆分文件')
  const result: ParsedImport = { totalCount: records.length, valid: [], errors: [] }
  for (const record of records) {
    if (record.error) {
      result.errors.push({ row: record.row, message: record.error })
      continue
    }
    const parsed = questionContentSchema.safeParse(record.value)
    if (!parsed.success) {
      result.errors.push({
        row: record.row,
        message: parsed.error.issues
          .slice(0, 5)
          .map((issue) => `${issue.path.join('.') || '题目'}：${issue.message}`)
          .join('；'),
      })
    } else result.valid.push({ row: record.row, content: parsed.data })
  }
  return result
}

export const csvTemplate =
  '\uFEFFtype,stem,optionA,optionB,optionC,optionD,answer,explanation,stage,grade,subject,difficulty,textbook,chapter,knowledgePoints,source,usageRights\nSINGLE,计算 1+1 的结果,1,2,3,4,B,相同单位相加,JUNIOR,七年级,数学,1,,有理数,有理数加法,自编示例,允许个人教学使用\n'
export const jsonTemplate = JSON.stringify(
  {
    questions: [
      {
        type: 'COMPOSITE',
        stem: '阅读材料：小明有 3 本书，又买了 2 本。',
        stage: 'JUNIOR',
        grade: '七年级',
        subject: '数学',
        difficulty: 1,
        knowledgePoints: ['有理数加法'],
        source: '自编示例',
        usageRights: '允许个人教学使用',
        children: [{ type: 'SHORT', stem: '小明现在有多少本书？', answer: '5 本', explanation: '3 + 2 = 5' }],
      },
    ],
  },
  null,
  2
)
