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
     * 获取当前管理员账号概览
     */
    async getOverview(headers: Headers): Promise<AdminAccountOverview> {
        try {
            const session = await getSessionFromHeaders(headers)

            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
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
                where: { userId: session.user.id },
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
     * 设置当前管理员密码
     */
    async setPassword(headers: Headers, newPassword: string): Promise<{ success: true }> {
        try {
            const session = await getSessionFromHeaders(headers)

            await auth.api.admin.setUserPassword({
                headers,
                body: {
                    userId: session.user.id,
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
     * 解绑当前管理员账号
     */
    async unlinkAccount(headers: Headers, accountId: string): Promise<{ success: true }> {
        try {
            const session = await getSessionFromHeaders(headers)

            await prisma.account.deleteMany({
                where: {
                    id: accountId,
                    userId: session.user.id,
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
