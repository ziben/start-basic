import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Prisma } from '~/generated/prisma/client'
import prisma from '@/shared/lib/db'

export type SystemLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type SystemLogInput = {
  level: SystemLogLevel
  requestId?: string
  method: string
  path: string
  query?: string | null
  status: number
  durationMs: number
  ip?: string | null
  userAgent?: string | null
  userId?: string | null
  userRole?: string | null
  error?: string | null
  meta?: Prisma.InputJsonValue | null
}

const LOG_DIR = process.env.LOG_DIR || 'logs'
const SYSTEM_LOG_SAMPLE_RATE = Number(process.env.SYSTEM_LOG_SAMPLE_RATE ?? '1')
const SYSTEM_LOG_SAMPLE_LEVELS = new Set<string>(
  String(process.env.SYSTEM_LOG_SAMPLE_LEVELS ?? 'info')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
)
const LOG_MAX_BODY_BYTES = Number(process.env.LOG_MAX_BODY_BYTES ?? String(8 * 1024))

type QueueState = {
  system: Array<Omit<SystemLogInput, 'meta'> & { meta?: Prisma.InputJsonValue | null; createdAt: Date }>
  audit: Array<Omit<AuditLogInput, 'meta'> & { meta?: Prisma.InputJsonValue | null; createdAt: Date }>
  scheduled: boolean
}

const globalForLogs = globalThis as unknown as { __logQueue?: QueueState }

function getQueue(): QueueState {
  if (!globalForLogs.__logQueue) {
    globalForLogs.__logQueue = { system: [], audit: [], scheduled: false }
  }
  return globalForLogs.__logQueue
}

export type AuditLogInput = {
  actorUserId?: string | null
  actorRole?: string | null
  action: string
  targetType: string
  targetId?: string | null
  ip?: string | null
  userAgent?: string | null
  success?: boolean
  message?: string | null
  meta?: Prisma.InputJsonValue | null
}

function toDateKey(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function ensureLogsDir() {
  const dir = path.join(process.cwd(), LOG_DIR)
  await mkdir(dir, { recursive: true })
  return dir
}

async function appendJsonl(filePath: string, obj: unknown) {
  const line = `${JSON.stringify(obj)}\n`
  await appendFile(filePath, line, { encoding: 'utf8' })
}

function safeStringifyError(err: unknown) {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`
  }
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

function shouldSample(level: SystemLogLevel) {
  if (!SYSTEM_LOG_SAMPLE_LEVELS.has(level)) return true

  const rate = Number.isFinite(SYSTEM_LOG_SAMPLE_RATE) ? SYSTEM_LOG_SAMPLE_RATE : 1
  if (rate >= 1) return true
  if (rate <= 0) return false
  return Math.random() < rate
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'pwd',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'authorization',
  'cookie',
  'set-cookie',
])

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (!isPlainObject(value)) return value

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : redact(v)
  }
  return out
}

export async function readRequestBodySafe(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null

  try {
    // clone to avoid consuming original body
    const text = await request.clone().text()
    const clipped = text.length > LOG_MAX_BODY_BYTES ? text.slice(0, LOG_MAX_BODY_BYTES) : text
    try {
      return redact(JSON.parse(clipped))
    } catch {
      return clipped
    }
  } catch {
    return null
  }
}

export function createRequestId() {
  return randomUUID()
}

export function getIpFromRequest(request: Request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || null
  return request.headers.get('x-real-ip') || null
}

export function getUserAgentFromRequest(request: Request) {
  return request.headers.get('user-agent') || null
}

/**
 * 将 TanStack Start 的服务器函数路径还原为易读的函数名
 */
export function getFriendlyFunctionName(path: string): string {
  if (path.startsWith('/_serverFn/')) {
    try {
      const base64 = path.substring('/_serverFn/'.length)
      const buffer = Buffer.from(base64, 'base64')
      const decoded = JSON.parse(buffer.toString('utf8'))
      if (decoded.export) {
        // 去掉 TanStack Start 自动添加的后缀
        return `[ServerFn] ${decoded.export.replace(/_createServerFn_handler$/, '')}`
      }
    } catch {
      // 忽略解码错误
    }
  }
  return path
}

export async function writeSystemLog(input: SystemLogInput) {
  const now = new Date()
  if (!shouldSample(input.level)) return

  const dir = await ensureLogsDir()
  const filePath = path.join(dir, `system-${toDateKey(now)}-${input.level}.jsonl`)

  const entry = {
    ...input,
    createdAt: now.toISOString(),
  }

  try {
    await appendJsonl(filePath, entry)
  } catch {
    // ignore
  }

  const queue = getQueue()
  queue.system.push({
    ...input,
    meta: input.meta ?? null,
    createdAt: now,
  })
  scheduleFlush()
}

export async function writeAuditLog(input: AuditLogInput) {
  const now = new Date()
  const dir = await ensureLogsDir()
  const filePath = path.join(dir, `audit-${toDateKey(now)}.jsonl`)

  const entry = {
    ...input,
    success: input.success ?? true,
    createdAt: now.toISOString(),
  }

  try {
    await appendJsonl(filePath, entry)
  } catch {
    // ignore
  }

  const queue = getQueue()
  queue.audit.push({
    ...input,
    success: input.success ?? true,
    meta: input.meta ?? null,
    createdAt: now,
  })
  scheduleFlush()
}

export function toErrorString(err: unknown) {
  return safeStringifyError(err)
}

function scheduleFlush() {
  const queue = getQueue()
  if (queue.scheduled) return
  queue.scheduled = true
  setTimeout(() => {
    void flushDb().finally(() => {
      const q = getQueue()
      q.scheduled = false
      if (q.system.length > 0 || q.audit.length > 0) scheduleFlush()
    })
  }, 100)
}

async function flushDb() {
  const queue = getQueue()
  const system = queue.system.splice(0, 200)
  const audit = queue.audit.splice(0, 200)

  if (system.length > 0) {
    try {
      await prisma.systemLog.createMany({
        data: system.map((s) => ({
          level: s.level,
          requestId: s.requestId,
          method: s.method,
          path: s.path,
          query: s.query ?? undefined,
          status: s.status,
          durationMs: s.durationMs,
          ip: s.ip ?? undefined,
          userAgent: s.userAgent ?? undefined,
          userId: s.userId ?? undefined,
          userRole: s.userRole ?? undefined,
          error: s.error ?? undefined,
          meta: s.meta ?? undefined,
          createdAt: s.createdAt,
        })),
      })
    } catch {
      // ignore
    }
  }

  if (audit.length > 0) {
    try {
      await prisma.auditLog.createMany({
        data: audit.map((a) => ({
          actorUserId: a.actorUserId ?? undefined,
          actorRole: a.actorRole ?? undefined,
          action: a.action,
          targetType: a.targetType,
          targetId: a.targetId ?? undefined,
          ip: a.ip ?? undefined,
          userAgent: a.userAgent ?? undefined,
          success: a.success ?? true,
          message: a.message ?? undefined,
          meta: a.meta ?? undefined,
          createdAt: a.createdAt,
        })),
      })
    } catch {
      // ignore
    }
  }
}





