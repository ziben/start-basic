import { StartAPIMethodContext } from '@tanstack/react-start/api'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

type HandlerCtx = StartAPIMethodContext & { user?: Awaited<ReturnType<typeof auth.api.getSession>>['user'] }
type Handler = (ctx: HandlerCtx) => Promise<Response> | Response

// 管理员鉴权中间件
export function withAdminAuth(handler: Handler): Handler {
  return async (ctx: HandlerCtx) => {
    try {
      const request = getRequest()
      const headers = request?.headers
      const session = headers ? await auth.api.getSession({ headers }) : null

      if (!session || session.user?.role !== 'admin') {
        return new Response('您没有访问此资源的权限', { status: 403 })
      }

      return handler({ ...ctx, user: session.user })
    } catch (error) {
      return new Response(`鉴权失败: ${String(error)}`, { status: 401 })
    }
  }
}
