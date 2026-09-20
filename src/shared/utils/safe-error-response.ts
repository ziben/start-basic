/**
 * 安全的错误响应处理
 * 在生产环境中隐藏详细错误信息，防止敏感信息泄露
 */
import { errorCodeForStatus, ServiceError, toSafeError } from './service-error'

interface ErrorResponseOptions {
  status?: number
  defaultMessage?: string
}

/**
 * 创建安全的错误响应
 * 详细错误仅记录在服务端；HTTP 与 Server Function 使用相同错误体。
 */
export function createSafeErrorResponse(error: unknown, options: ErrorResponseOptions = {}): Response {
  return createSafeJsonErrorResponse(error, options)
}

/**
 * 创建安全的 JSON 错误响应
 */
export function createSafeJsonErrorResponse(error: unknown, options: ErrorResponseOptions = {}): Response {
  const safe = toSafeError(
    options.status ? new ServiceError(errorCodeForStatus(options.status), options.defaultMessage) : error
  )
  console.error('[SERVER ERROR]', error)
  return Response.json(safe, { status: safe.status })
}

/**
 * 常用错误响应快捷方法
 */
export const SafeResponse = {
  badRequest: (error: unknown, message = '请求参数错误') =>
    createSafeErrorResponse(error, { status: 400, defaultMessage: message }),

  unauthorized: (error: unknown, message = '未授权访问') =>
    createSafeErrorResponse(error, { status: 401, defaultMessage: message }),

  forbidden: (error: unknown, message = '无权限访问') =>
    createSafeErrorResponse(error, { status: 403, defaultMessage: message }),

  notFound: (error: unknown, message = '资源不存在') =>
    createSafeErrorResponse(error, { status: 404, defaultMessage: message }),

  serverError: (error: unknown, message = '服务器错误') =>
    createSafeErrorResponse(error, { status: 500, defaultMessage: message }),
}
