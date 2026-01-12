import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/modules/identity/shared/lib/auth'
import {
    writeSystemLog,
    writeAuditLog,
    createRequestId,
    getIpFromRequest,
    getUserAgentFromRequest,
    toErrorString,
} from '../services/server-log-writer'
import { checkPermission } from '../lib/permission-check'

/**
 * 集中管理管理员权限检查并记录日志
 */
export async function requireAdmin(actionName?: string) {
    const start = Date.now()
    const request = getRequest()
    if (!request) {
        throw new Error('无法获取请求信息')
    }

    const requestId = createRequestId()
    const ip = getIpFromRequest(request)
    const userAgent = getUserAgentFromRequest(request)
    const url = new URL(request.url)
    let path = url.pathname
    let query = url.search || null

    // Prettify Server Function path for logs
    if (path === '/_server' || path === '/api/functions') {
        const fnId = url.searchParams.get('_serverFunctionId')
        if (fnId) {
            path = `[ServerFn] ${fnId}`
        }
    }

    // Truncate long query
    if (query && query.length > 255) {
        query = query.substring(0, 255) + '...'
    }

    try {
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session?.user) {
            void writeSystemLog({
                level: 'warn',
                requestId,
                method: request.method,
                path,
                query,
                status: 401,
                durationMs: Date.now() - start,
                ip,
                userAgent,
                userId: null,
                userRole: null,
                error: '未登录',
                meta: { action: actionName },
            })
            throw new Error('未登录')
        }

        const adminRoles = ['admin', 'superadmin']
        const userRoleStr = session.user.role || ''
        const userRoles = userRoleStr.split(',').map((r: string) => r.trim())
        const hasAdminRole = userRoles.some((r: string) => adminRoles.includes(r))

        if (!hasAdminRole) {
            void writeSystemLog({
                level: 'warn',
                requestId,
                method: request.method,
                path,
                query,
                status: 403,
                durationMs: Date.now() - start,
                ip,
                userAgent,
                userId: session.user.id,
                userRole: userRoleStr,
                error: '无权限访问',
                meta: { action: actionName },
            })
            throw new Error('无权限访问')
        }

        // 如果提供了动作名称，记录审计日志
        if (actionName) {
            void writeAuditLog({
                actorUserId: session.user.id,
                actorRole: userRoleStr,
                action: actionName,
                targetType: 'ServerFn',
                ip,
                userAgent,
                success: true,
            })
        }

        // 记录系统日志（正常访问）
        void writeSystemLog({
            level: 'info',
            requestId,
            method: request.method,
            path,
            query,
            status: 200,
            durationMs: Date.now() - start,
            ip,
            userAgent,
            userId: session.user.id,
            userRole: userRoleStr,
            meta: { action: actionName },
        })

        return session.user
    } catch (error) {
        if (error instanceof Error && (error.message === '未登录' || error.message === '无权限访问')) {
            throw error
        }

        void writeSystemLog({
            level: 'error',
            requestId,
            method: request.method,
            path,
            query,
            status: 500,
            durationMs: Date.now() - start,
            ip,
            userAgent,
            userId: null,
            userRole: null,
            error: toErrorString(error),
            meta: { action: actionName },
        })
        throw error
    }
}

/**
 * 要求用户有指定的细粒度权限
 * 使用 better-auth 的 access control
 */
export async function requirePermission(
    permission: string,
    options?: {
        organizationId?: string
        actionName?: string
    }
) {
    const start = Date.now()
    const request = getRequest()
    if (!request) {
        throw new Error('无法获取请求信息')
    }

    const requestId = createRequestId()
    const ip = getIpFromRequest(request)
    const userAgent = getUserAgentFromRequest(request)
    const url = new URL(request.url)
    let path = url.pathname
    let query = url.search || null

    if (path === '/_server' || path === '/api/functions') {
        const fnId = url.searchParams.get('_serverFunctionId')
        if (fnId) {
            path = `[ServerFn] ${fnId}`
        }
    }

    if (query && query.length > 255) {
        query = query.substring(0, 255) + '...'
    }

    try {
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session?.user) {
            void writeSystemLog({
                level: 'warn',
                requestId,
                method: request.method,
                path,
                query,
                status: 401,
                durationMs: Date.now() - start,
                ip,
                userAgent,
                userId: null,
                userRole: null,
                error: '未登录',
                meta: { permission, action: options?.actionName },
            })
            throw new Error('未登录')
        }

        // 检查权限
        const hasPermission = await checkPermission(
            session.user.id,
            permission,
            options
        )

        if (!hasPermission) {
            const role = session.user.role || ''
            void writeSystemLog({
                level: 'warn',
                requestId,
                method: request.method,
                path,
                query,
                status: 403,
                durationMs: Date.now() - start,
                ip,
                userAgent,
                userId: session.user.id,
                userRole: role,
                error: `缺少权限: ${permission}`,
                meta: { permission, action: options?.actionName },
            })
            throw new Error(`缺少权限: ${permission}`)
        }

        // 记录审计日志
        if (options?.actionName) {
            void writeAuditLog({
                actorUserId: session.user.id,
                actorRole: session.user.role || '',
                action: options.actionName,
                targetType: 'ServerFn',
                ip,
                userAgent,
                success: true,
                meta: { permission },
            })
        }

        void writeSystemLog({
            level: 'info',
            requestId,
            method: request.method,
            path,
            query,
            status: 200,
            durationMs: Date.now() - start,
            ip,
            userAgent,
            userId: session.user.id,
            userRole: session.user.role || '',
            meta: { permission, action: options?.actionName },
        })

        return session.user
    } catch (error) {
        if (error instanceof Error && (error.message === '未登录' || error.message.includes('缺少权限'))) {
            throw error
        }

        void writeSystemLog({
            level: 'error',
            requestId,
            method: request.method,
            path,
            query,
            status: 500,
            durationMs: Date.now() - start,
            ip,
            userAgent,
            userId: null,
            userRole: null,
            error: toErrorString(error),
            meta: { permission, action: options?.actionName },
        })
        throw error
    }
}
