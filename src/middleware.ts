import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

// 类型定义
type SessionUser = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user']

interface HandlerContext {
  request: Request
}

interface AuthenticatedContext extends HandlerContext {
  user: SessionUser
}

type Handler<T = HandlerContext> = (ctx: T) => Promise<Response> | Response

const ADMIN_ROLES = new Set(['admin', 'superadmin'])

function hasAdminRole(role: unknown) {
  if (typeof role !== 'string') return false
  return role
    .split(',')
    .map((r) => r.trim())
    .some((r) => ADMIN_ROLES.has(r))
}

// 管理员鉴权中间件
export function withAdminAuth(handler: Handler<AuthenticatedContext>) {
  return async (ctx: HandlerContext) => {
    try {
      const request = getRequest()
      const headers = request?.headers
      const session = headers ? await auth.api.getSession({ headers }) : null

      const role = session?.user?.role
      if (!session || !hasAdminRole(role)) {
        return new Response('您没有访问此资源的权限', { status: 403 })
      }

      return handler({ ...ctx, user: session.user as SessionUser })
    } catch {
      return new Response('鉴权失败', { status: 401 })
    }
  }
}

// 导出类型供其他模块使用
export type { SessionUser, AuthenticatedContext, HandlerContext }
