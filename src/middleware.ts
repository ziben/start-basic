import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/modules/auth/shared/lib/auth'
import {
  createRequestId,
  getIpFromRequest,
  getUserAgentFromRequest,
  readRequestBodySafe,
  toErrorString,
  writeAuditLog,
  writeSystemLog,
  getFriendlyFunctionName,
} from '~/modules/admin/shared/services/server-log-writer'
import { getRuntimeConfig } from '~/shared/config/runtime-config'

// 类型定义
type SessionUser = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user']

interface HandlerContext {
  request: Request
  params?: Record<string, string>
}

interface AuthenticatedContext extends HandlerContext {
  user: SessionUser
  requestId: string
  audit: {
    log: (
      input: Omit<
        Parameters<typeof writeAuditLog>[0],
        'actorUserId' | 'actorRole' | 'ip' | 'userAgent'
      > & {
        actorUserId?: string | null
        actorRole?: string | null
        ip?: string | null
        userAgent?: string | null
      }
    ) => Promise<void>
  }
}

type Handler<T = HandlerContext> = (ctx: T) => Promise<Response> | Response

const ADMIN_ROLES = new Set(['admin', 'superadmin'])

/**
 * 检查用户是否有管理员角色
 * better-auth 支持多角色，用逗号分隔
 */
function hasAdminRole(role: unknown): boolean {
  if (typeof role !== 'string') return false
  return role
    .split(',')
    .map((r) => r.trim())
    .some((r) => ADMIN_ROLES.has(r))
}


// 普通用户鉴权中间件（登录即可）
export function withAuth<T extends HandlerContext>(handler: Handler<T & AuthenticatedContext>) {
  return async (ctx: T) => {
    const start = Date.now()
    const request = getRequest() ?? ctx.request
    const requestId = createRequestId()
    const ip = getIpFromRequest(request)
    const userAgent = getUserAgentFromRequest(request)
    const shouldLogBody = getRuntimeConfig('log.requestBody.enabled')
    const requestBody = shouldLogBody ? await readRequestBodySafe(request) : null

    try {
      const headers = request?.headers
      const session = headers ? await auth.api.getSession({ headers }) : null

      if (!session) {
        const res = new Response('您没有访问此资源的权限', { status: 403 })
        void writeSystemLog({
          level: 'warn',
          requestId,
          method: request.method,
          path: getFriendlyFunctionName(new URL(request.url).pathname),
          query: new URL(request.url).search || null,
          status: res.status,
          durationMs: Date.now() - start,
          ip,
          userAgent,
          userId: null,
          userRole: null,
          error: null,
          meta: { reason: 'forbidden' },
        })
        return res
      }

      const role = session?.user?.role

      const audit = {
        log: async (
          input: Omit<
            Parameters<typeof writeAuditLog>[0],
            'actorUserId' | 'actorRole' | 'ip' | 'userAgent'
          > & {
            actorUserId?: string | null
            actorRole?: string | null
            ip?: string | null
            userAgent?: string | null
          }
        ) => {
          await writeAuditLog({
            actorUserId: input.actorUserId ?? session.user.id,
            actorRole: input.actorRole ?? (typeof role === 'string' ? role : null),
            ip: input.ip ?? ip,
            userAgent: input.userAgent ?? userAgent,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            success: input.success ?? true,
            message: input.message ?? null,
            meta: input.meta ?? null,
          })
        },
      }

      const res = await handler({
        ...ctx,
        user: session.user as SessionUser,
        requestId,
        audit,
      })

      void writeSystemLog({
        level: res.status >= 500 ? 'error' : res.status >= 400 ? 'warn' : 'info',
        requestId,
        method: request.method,
        path: getFriendlyFunctionName(new URL(request.url).pathname),
        query: new URL(request.url).search || null,
        status: res.status,
        durationMs: Date.now() - start,
        ip,
        userAgent,
        userId: session.user.id,
        userRole: typeof role === 'string' ? role : null,
        error: null,
        meta: requestBody ? { requestBody } : null,
      })

      return res
    } catch (err) {
      const res = new Response('鉴权失败', { status: 401 })
      void writeSystemLog({
        level: 'error',
        requestId,
        method: request.method,
        path: getFriendlyFunctionName(new URL(request.url).pathname),
        query: new URL(request.url).search || null,
        status: res.status,
        durationMs: Date.now() - start,
        ip,
        userAgent,
        userId: null,
        userRole: null,
        error: toErrorString(err),
        meta: { phase: 'auth' },
      })
      return res
    }
  }
}

// 管理员鉴权中间件
export function withAdminAuth<T extends HandlerContext>(handler: Handler<T & AuthenticatedContext>) {
  return async (ctx: T) => {
    const start = Date.now()
    const request = getRequest() ?? ctx.request
    const requestId = createRequestId()
    const ip = getIpFromRequest(request)
    const userAgent = getUserAgentFromRequest(request)
    const shouldLogBody = getRuntimeConfig('log.requestBody.enabled')
    const requestBody = shouldLogBody ? await readRequestBodySafe(request) : null

    try {
      const headers = request?.headers
      const session = headers ? await auth.api.getSession({ headers }) : null

      const role = session?.user?.role
      if (!session || !hasAdminRole(role)) {
        const res = new Response('您没有访问此资源的权限', { status: 403 })
        void writeSystemLog({
          level: 'warn',
          requestId,
          method: request.method,
          path: getFriendlyFunctionName(new URL(request.url).pathname),
          query: new URL(request.url).search || null,
          status: res.status,
          durationMs: Date.now() - start,
          ip,
          userAgent,
          userId: session?.user?.id ?? null,
          userRole: typeof role === 'string' ? role : null,
          error: null,
          meta: { reason: 'forbidden' },
        })
        return res
      }

      const audit = {
        log: async (
          input: Omit<
            Parameters<typeof writeAuditLog>[0],
            'actorUserId' | 'actorRole' | 'ip' | 'userAgent'
          > & {
            actorUserId?: string | null
            actorRole?: string | null
            ip?: string | null
            userAgent?: string | null
          }
        ) => {
          await writeAuditLog({
            actorUserId: input.actorUserId ?? session.user.id,
            actorRole: input.actorRole ?? (typeof role === 'string' ? role : null),
            ip: input.ip ?? ip,
            userAgent: input.userAgent ?? userAgent,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            success: input.success ?? true,
            message: input.message ?? null,
            meta: input.meta ?? null,
          })
        },
      }

      const res = await handler({
        ...ctx,
        user: session.user as SessionUser,
        requestId,
        audit,
      })

      void writeSystemLog({
        level: res.status >= 500 ? 'error' : res.status >= 400 ? 'warn' : 'info',
        requestId,
        method: request.method,
        path: getFriendlyFunctionName(new URL(request.url).pathname),
        query: new URL(request.url).search || null,
        status: res.status,
        durationMs: Date.now() - start,
        ip,
        userAgent,
        userId: session.user.id,
        userRole: typeof role === 'string' ? role : null,
        error: null,
        meta: requestBody ? { requestBody } : null,
      })

      return res
    } catch (err) {
      const res = new Response('鉴权失败', { status: 401 })
      void writeSystemLog({
        level: 'error',
        requestId,
        method: request.method,
        path: getFriendlyFunctionName(new URL(request.url).pathname),
        query: new URL(request.url).search || null,
        status: res.status,
        durationMs: Date.now() - start,
        ip,
        userAgent,
        userId: null,
        userRole: null,
        error: toErrorString(err),
        meta: { phase: 'auth' },
      })
      return res
    }
  }
}

// 导出类型供其他模块使用
export type { SessionUser, AuthenticatedContext, HandlerContext }






