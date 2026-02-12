/**
 * Account Service - 纯业务逻辑层
 */

import prisma from '@/shared/lib/db'
import { auth } from '~/modules/auth/shared/lib/auth'

export type AdminAccountOverview = {
    session: {
        id: string | null
        expiresAt: Date | null
        user: {
            id: string
            email: string | null
            name: string | null
            role?: string | null
            username?: string | null
        }
    }
    user: {
        id: string
        email: string | null
        name: string | null
        role: string | null
        username: string | null
        banned: boolean | null
        createdAt: Date | null
        updatedAt: Date | null
    } | null
    accounts: Array<{
        id: string
        providerId: string
        accountId: string
        scope: string | null
        createdAt: Date
        updatedAt: Date
    }>
}

async function getSessionFromHeaders(headers: Headers): Promise<Awaited<ReturnType<typeof auth.api.getSession>>> {
    const session = await auth.api.getSession({ headers })
    if (!session?.user) {
        throw new Error('未登录')
    }
    return session
}

export const AccountService = {
    /**
     * 获取管理员账号概览（可指定 userId）
     */
    async getOverview(headers: Headers, userId?: string): Promise<AdminAccountOverview> {
        try {
            const session = await getSessionFromHeaders(headers)
            const targetUserId = userId || session.user.id

            const user = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    username: true,
                    banned: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })

            const accounts = await prisma.account.findMany({
                where: { userId: targetUserId },
                select: {
                    id: true,
                    providerId: true,
                    accountId: true,
                    scope: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            })

            return {
                session: {
                    id: session.session?.id ?? null,
                    expiresAt: session.session?.expiresAt ?? null,
                    user: {
                        id: session.user.id,
                        email: session.user.email ?? null,
                        name: session.user.name ?? null,
                        role: session.user.role ?? null,
                        username: session.user.username ?? null,
                    },
                },
                user,
                accounts,
            }
        } catch (error) {
            console.error('获取账号信息失败:', error)
            throw error instanceof Error ? error : new Error('获取账号信息失败')
        }
    },

    /**
     * 设置管理员密码（可指定 userId）
     */
    async setPassword(headers: Headers, newPassword: string, userId?: string): Promise<{ success: true }> {
        try {
            const session = await getSessionFromHeaders(headers)
            const targetUserId = userId || session.user.id

            await auth.api.admin.setUserPassword({
                headers,
                body: {
                    userId: targetUserId,
                    newPassword,
                },
            })

            return { success: true as const }
        } catch (error) {
            console.error('重置密码失败:', error)
            throw error instanceof Error ? error : new Error('重置密码失败')
        }
    },

    /**
     * 解绑管理员账号（可指定 userId）
     */
    async unlinkAccount(headers: Headers, accountId: string, userId?: string): Promise<{ success: true }> {
        try {
            const session = await getSessionFromHeaders(headers)
            const targetUserId = userId || session.user.id

            await prisma.account.deleteMany({
                where: {
                    id: accountId,
                    userId: targetUserId,
                },
            })

            return { success: true as const }
        } catch (error) {
            console.error('解绑账号失败:', error)
            throw error instanceof Error ? error : new Error('解绑账号失败')
        }
    },
}

export default AccountService
