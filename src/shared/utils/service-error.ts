import { ZodError } from 'zod'

const definitions = {
  BAD_REQUEST: { status: 400, message: '请求参数错误' },
  UNAUTHORIZED: { status: 401, message: '未登录' },
  FORBIDDEN: { status: 403, message: '无权限访问' },
  NOT_FOUND: { status: 404, message: '资源不存在' },
  CONFLICT: { status: 409, message: '数据冲突，请刷新后重试' },
  INTERNAL_ERROR: { status: 500, message: '服务器错误，请稍后重试' },
} as const

export type ErrorCode = keyof typeof definitions

export class ServiceError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string
  ) {
    super(message ?? definitions[code].message)
    this.name = 'ServiceError'
  }
}

// TanStack's Standard Schema adapter serializes Zod issues into an Error message.
function isValidationError(error: unknown): boolean {
  if (error instanceof ZodError) return true
  if (!(error instanceof Error) || !error.message.startsWith('[')) return false
  try {
    const issues: unknown = JSON.parse(error.message)
    return (
      Array.isArray(issues) &&
      issues.length > 0 &&
      issues.every(
        (issue) =>
          issue && typeof issue.code === 'string' && Array.isArray(issue.path) && typeof issue.message === 'string'
      )
    )
  } catch {
    return false
  }
}

export function toSafeError(error: unknown) {
  let code: ErrorCode = error instanceof ServiceError ? error.code : 'INTERNAL_ERROR'
  if (isValidationError(error)) code = 'BAD_REQUEST'
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2002') code = 'CONFLICT'
    if (error.code === 'P2025') code = 'NOT_FOUND'
  }
  const { status, message: fallback } = definitions[code]
  const message = error instanceof ServiceError ? error.message : fallback
  return { success: false as const, code, status, error: message, message }
}

export function errorCodeForStatus(status: number): ErrorCode {
  return (Object.keys(definitions) as ErrorCode[]).find((key) => definitions[key].status === status) ?? 'INTERNAL_ERROR'
}
