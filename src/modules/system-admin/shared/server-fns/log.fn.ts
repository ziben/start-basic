/**
 * Log ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListLogsSchema = z.object({
    type: z.enum(['system', 'audit']).optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    success: z.boolean().optional(),
    action: z.string().optional(),
    actorUserId: z.string().optional(),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
})

// ============ 认证辅助函数 ============

async function requireAdmin() {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/identity/shared/lib/auth')

    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw new Error('未登录')

    const adminRoles = ['admin', 'superadmin']
    if (!adminRoles.includes(session.user.role || '')) throw new Error('无权限访问')

    return session.user
}

// ============ ServerFn 定义 ============

export const getLogsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListLogsSchema>) => (data ? ListLogsSchema.parse(data) : {}))
    .handler(async ({ data }) => {
        await requireAdmin()
        const { LogService } = await import('../services/log.service')
        return LogService.getList(data)
    })
