/**
 * 安全的错误响应处理
 * 在生产环境中隐藏详细错误信息，防止敏感信息泄露
 */

const isDev = process.env.NODE_ENV === 'development'

interface ErrorResponseOptions {
  status?: number
  defaultMessage?: string
}

/**
 * 创建安全的错误响应
 * - 开发环境：显示详细错误信息便于调试
 * - 生产环境：显示通用错误信息，详细信息仅记录日志
 */
export function createSafeErrorResponse(
  error: unknown,
  options: ErrorResponseOptions = {}
): Response {
  const { status = 500, defaultMessage = '操作失败' } = options

  // 开发环境显示详细错误
  if (isDev) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[DEV ERROR]', error)
    return new Response(errorMessage, { status })
  }

  // 生产环境只记录日志，返回通用消息
  console.error('[PROD ERROR]', error)
  return new Response(defaultMessage, { status })
}

/**
 * 创建安全的 JSON 错误响应
 */
export function createSafeJsonErrorResponse(
  error: unknown,
  options: ErrorResponseOptions = {}
): Response {
  const { status = 500, defaultMessage = '操作失败' } = options

  const errorMessage = isDev
    ? (error instanceof Error ? error.message : String(error))
    : defaultMessage

  if (isDev) {
    console.error('[DEV ERROR]', error)
  } else {
    console.error('[PROD ERROR]', error)
  }

  return Response.json(
    { error: errorMessage, success: false },
    { status }
  )
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
