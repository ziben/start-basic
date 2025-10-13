import { getWebRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { StartAPIMethodCallback } from '@tanstack/react-start/api'

// 管理员鉴权中间件
// Short-term: relax types to avoid dependency/type mismatches with StartAPIMethodCallback
export function withAdminAuth(handler: any): any {
  return async (ctx: any) => {
    try {
      const { headers } = getWebRequest()!
      const session = await auth.api.getSession({ headers })
      
      if (!session || session.user?.role !== 'admin') {
        return new Response('您没有访问此资源的权限', { status: 403 })
      }
      
      return handler(ctx)
    } catch (error) {
      return new Response(`鉴权失败: ${error}`, { status: 401 })
    }
  }
}
