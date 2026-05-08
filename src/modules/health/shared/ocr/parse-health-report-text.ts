export type ParsedHealthMetricFlag = 'LOW' | 'NORMAL' | 'HIGH' | 'ABNORMAL' | 'UNKNOWN'

export interface ParsedHealthMetric {
  readonly rawName: string
  readonly valueText: string
  readonly numericValue?: number
  readonly unit?: string
  readonly referenceRange?: string
  readonly flag: ParsedHealthMetricFlag
  readonly rawLine: string
  readonly orderIndex: number
}

const knownFlags = new Map<string, ParsedHealthMetricFlag>([
  ['低', 'LOW'],
  ['偏低', 'LOW'],
  ['↓', 'LOW'],
  ['L', 'LOW'],
  ['高', 'HIGH'],
  ['偏高', 'HIGH'],
  ['↑', 'HIGH'],
  ['H', 'HIGH'],
  ['正常', 'NORMAL'],
  ['阴性', 'NORMAL'],
  ['阳性', 'ABNORMAL'],
  ['异常', 'ABNORMAL'],
])

const ignoredLinePattern = /^(项目|指标|名称|参考范围|单位|结果|检验|报告|姓名|性别|年龄|科室|医生|样本)/i
const valuePattern = /^(.+?)\s+([<>≤≥]?\s*-?\d+(?:\.\d+)?|阴性|阳性|未见异常|正常|异常)\s*(.*)$/
const rangePattern = /^[<>≤≥]?\s*-?\d+(?:\.\d+)?\s*(?:[-~—至]\s*[<>≤≥]?\s*-?\d+(?:\.\d+)?)$/

export function parseHealthReportText(text: string): ParsedHealthMetric[] {
  return normalizeLines(text)
    .map((line, index) => parseMetricLine(line, index))
    .filter((metric): metric is ParsedHealthMetric => metric !== null)
}

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && !ignoredLinePattern.test(line))
}

function parseMetricLine(line: string, orderIndex: number): ParsedHealthMetric | null {
  const match = line.match(valuePattern)
  if (!match) return null

  const rawName = cleanupName(match[1])
  const valueText = match[2].replace(/\s+/g, '')
  const tail = match[3]?.trim() ?? ''

  if (!rawName || rawName.length > 40) return null

  return {
    rawName,
    valueText,
    numericValue: parseNumericValue(valueText),
    unit: extractUnit(tail),
    referenceRange: extractReferenceRange(tail),
    flag: extractFlag(tail, valueText),
    rawLine: line,
    orderIndex,
  }
}

function cleanupName(name: string): string {
  return name
    .replace(/^[\d.、\s]+/, '')
    .replace(/[:：]$/, '')
    .trim()
}

function parseNumericValue(valueText: string): number | undefined {
  const match = valueText.match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined

  const value = Number(match[0])
  return Number.isFinite(value) ? value : undefined
}

function extractFlag(tail: string, valueText: string): ParsedHealthMetricFlag {
  const valueFlag = matchFlag(valueText)
  if (valueFlag !== 'UNKNOWN') return valueFlag

  const tailFlag = tail
    .split(/\s+/)
    .map(matchFlag)
    .find((flag) => flag !== 'UNKNOWN')

  return tailFlag ?? 'UNKNOWN'
}

function extractReferenceRange(tail: string): string | undefined {
  return splitTail(tail)
    .find((part) => rangePattern.test(part))
    ?.replace(/\s+/g, '')
}

function extractUnit(tail: string): string | undefined {
  const unit = splitTail(tail).find((part) => isUnitToken(part))
  return unit || undefined
}

function splitTail(tail: string): string[] {
  return tail
    .replace(/[()（）]/g, ' ')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function isUnitToken(part: string): boolean {
  if (rangePattern.test(part)) return false
  if (matchFlag(part) !== 'UNKNOWN') return false
  return /[/%a-zA-Zμµ]/.test(part)
}

function matchFlag(token: string): ParsedHealthMetricFlag {
  const trimmed = token.trim()

  for (const [keyword, flag] of knownFlags) {
    if (trimmed === keyword) return flag
  }

  if (trimmed.includes('偏高')) return 'HIGH'
  if (trimmed.includes('偏低')) return 'LOW'
  if (trimmed.includes('异常')) return 'ABNORMAL'
  if (trimmed.includes('正常')) return 'NORMAL'

  return 'UNKNOWN'
}
