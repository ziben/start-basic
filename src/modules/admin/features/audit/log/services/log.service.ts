/**
 * Log Service - 纯业务逻辑层 (Prisma 实现)
 * [迁移自 admin/shared/services/log.service.ts]
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListLogsInput {
    type?: 'system' | 'audit'
    page?: number
    pageSize?: number
    filter?: string
    level?: 'debug' | 'info' | 'warn' | 'error'
    success?: boolean
    action?: string
    actorUserId?: string
    targetType?: string
    targetId?: string
    from?: string
    to?: string
}

// ============ Service 实现 ============

export const LogService = {
    /**
     * 获取日志列表（分页）
     */
    async getList(input: ListLogsInput = {}) {
        try {
            const {
                type = 'system',
                page = 1,
                pageSize = 20,
                filter = '',
                level,
                success,
                action,
                actorUserId,
                targetType,
                targetId,
                from,
                to,
            } = input

            const skip = (page - 1) * pageSize
            const q = filter.trim()
            const fromDate = from ? new Date(from) : undefined
            const toDate = to ? new Date(to) : undefined

            if (type === 'audit') {
                const where = {
                    ...(action ? { action: { contains: action } } : {}),
                    ...(actorUserId ? { actorUserId } : {}),
                    ...(targetType ? { targetType } : {}),
                    ...(targetId ? { targetId } : {}),
                    ...(typeof success === 'boolean' ? { success } : {}),
                    ...(fromDate || toDate
                        ? {
                            createdAt: {
                                ...(fromDate ? { gte: fromDate } : {}),
                                ...(toDate ? { lte: toDate } : {}),
                            },
                        }
                        : {}),
                    ...(q
                        ? {
                            OR: [
                                { action: { contains: q } },
                                { targetType: { contains: q } },
                                { targetId: { contains: q } },
                                { actorUserId: { contains: q } },
                                { actorRole: { contains: q } },
                                { message: { contains: q } },
                            ],
                        }
                        : {}),
                }

                const [total, items] = await Promise.all([
                    prisma.auditLog.count({ where }),
                    prisma.auditLog.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: pageSize,
                    }),
                ])

                return {
                    type: 'audit' as const,
                    items,
                    total,
                    page,
                    pageSize,
                    pageCount: Math.ceil(total / pageSize),
                }
            }

            // System logs
            const where = {
                ...(level ? { level } : {}),
                ...(actorUserId ? { userId: actorUserId } : {}),
                ...(fromDate || toDate
                    ? {
                        createdAt: {
                            ...(fromDate ? { gte: fromDate } : {}),
                            ...(toDate ? { lte: toDate } : {}),
                        },
                    }
                    : {}),
                ...(q
                    ? {
                        OR: [
                            { method: { contains: q } },
                            { path: { contains: q } },
                            { query: { contains: q } },
                            { requestId: { contains: q } },
                            { userId: { contains: q } },
                            { userRole: { contains: q } },
                            { error: { contains: q } },
                        ],
                    }
                    : {}),
            }

            const [total, items] = await Promise.all([
                prisma.systemLog.count({ where }),
                prisma.systemLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageSize,
                }),
            ])

            return {
                type: 'system' as const,
                items,
                total,
                page,
                pageSize,
                pageCount: Math.ceil(total / pageSize),
            }
        } catch (error) {
            console.error('获取日志列表失败:', error)
            throw new Error('获取日志列表失败')
        }
    },
}

export default LogService
