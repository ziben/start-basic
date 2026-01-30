/**
 * Session Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListSessionsInput {
    page?: number
    pageSize?: number
    filter?: string
    status?: ('active' | 'expired')[]
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    userId?: string
}

export interface SessionItem {
    id: string
    userId: string
    username: string
    email: string
    loginTime: string
    expiresAt: string
    ipAddress: string
    userAgent: string
    isActive: boolean
}

// ============ Service 实现 ============

export const SessionService = {
    /**
     * 获取会话列表（分页）
     */
    async getList(input: ListSessionsInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', status = [], sortBy, sortDir, userId } = input
            const now = new Date()

            // 状态过滤
            const statusWhere = (() => {
                if (status.includes('active') && !status.includes('expired')) {
                    return { expiresAt: { gt: now } }
                }
                if (status.includes('expired') && !status.includes('active')) {
                    return { expiresAt: { lte: now } }
                }
                return {}
            })()

            // 搜索过滤
            const filterWhere = filter
                ? {
                    OR: [
                        { id: { contains: filter } },
                        { userId: { contains: filter } },
                        { ipAddress: { contains: filter } },
                        { userAgent: { contains: filter } },
                        {
                            user: {
                                OR: [{ name: { contains: filter } }, { email: { contains: filter } }],
                            },
                        },
                    ],
                }
                : {}

            const where = {
                ...(userId ? { userId } : {}),
                ...statusWhere,
                ...filterWhere,
            }

            const [total, sessions] = await Promise.all([
                prisma.session.count({ where }),
                prisma.session.findMany({
                    where,
                    orderBy: sortBy ? { [sortBy]: sortDir ?? 'asc' } : { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                }),
            ])

            const items: SessionItem[] = sessions.map((s) => ({
                id: s.id,
                userId: s.userId,
                username: s.user?.name ?? '',
                email: s.user?.email ?? '',
                loginTime: s.createdAt.toISOString(),
                expiresAt: s.expiresAt.toISOString(),
                ipAddress: s.ipAddress ?? '',
                userAgent: s.userAgent ?? '',
                isActive: s.expiresAt > now,
            }))

            const pageCount = Math.ceil(total / pageSize)
            return { items, total, page, pageSize, pageCount }
        } catch (error) {
            console.error('获取会话列表失败:', error)
            throw new Error('获取会话列表失败')
        }
    },

    /**
     * 批量删除会话
     */
    async bulkDelete(ids: string[]) {
        try {
            const result = await prisma.session.deleteMany({
                where: { id: { in: ids } },
            })

            return { success: true as const, count: result.count }
        } catch (error) {
            console.error('批量删除会话失败:', error)
            throw new Error('批量删除会话失败')
        }
    },

    /**
     * 删除单个会话
     */
    async delete(id: string) {
        try {
            await prisma.session.delete({
                where: { id },
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除会话失败:', error)
            throw new Error('删除会话失败')
        }
    },
}

export default SessionService
