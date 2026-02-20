import { z } from 'zod'

// ─── 枚举常量 ──────────────────────────────────────────────────────────────────

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export const LOG_TYPES = ['system', 'audit'] as const
export type LogType = (typeof LOG_TYPES)[number]

// ─── Zod Schema ────────────────────────────────────────────────────────────────

export const systemLogSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  level: z.enum(LOG_LEVELS),
  requestId: z.string().nullable(),
  method: z.string(),
  path: z.string(),
  query: z.string().nullable(),
  status: z.number(),
  durationMs: z.number(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string().nullable(),
  userRole: z.string().nullable(),
  error: z.string().nullable(),
  meta: z.unknown().nullable(),
})

export const auditLogSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  actorUserId: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  success: z.boolean(),
  message: z.string().nullable(),
  meta: z.unknown().nullable(),
})

export type SystemLog = z.infer<typeof systemLogSchema>
export type AuditLog = z.infer<typeof auditLogSchema>
export type AdminLog = SystemLog | AuditLog

// ─── UI 常量 ──────────────────────────────────────────────────────────────────

export const logLevels = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
] as const

export const auditResults = [
  { label: '成功', value: 'true' },
  { label: '失败', value: 'false' },
] as const

export const logTypes = [
  { label: '系统日志', value: 'system' },
  { label: '操作日志', value: 'audit' },
] as const
