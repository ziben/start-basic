/**
 * User Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'
import { serializeAdminUser, serializeAdminUsers, isValidUserSortField } from '../utils/admin-utils'
import { auth } from '~/modules/identity/shared/lib/auth'
import { nanoid } from 'nanoid'

// ============ 类型定义 ============

export interface ListUsersInput {
    page?: number
    pageSize?: number
    filter?: string
    banned?: boolean
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface CreateUserInput {
    email: string
    password: string
    name: string
    role?: string
    username?: string
    banned?: boolean
}

export interface UpdateUserInput {
    name?: string
    username?: string | null
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    banExpires?: string | null
}

// ============ Service 实现 ============

export const UserService = {
    /**
     * 获取用户列表（分页）
     */
    async getList(input: ListUsersInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', banned, sortBy, sortDir } = input

            const q = filter.trim()
            const whereClause: any = {
                ...(q
                    ? {
                        OR: [
                            { id: { contains: q } },
                            { name: { contains: q } },
                            { email: { contains: q } },
                            { username: { contains: q } },
                        ],
                    }
                    : {}),
                ...(typeof banned === 'boolean' ? { banned } : {}),
            }

            const [total, users] = await Promise.all([
                prisma.user.count({ where: whereClause }),
                prisma.user.findMany({
                    where: whereClause,
                    orderBy:
                        sortBy && isValidUserSortField(sortBy)
                            ? { [sortBy]: sortDir ?? 'asc' }
                            : { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
            ])

            const items = serializeAdminUsers(users as any)
            const pageCount = Math.ceil(total / pageSize)

            return {
                items,
                total,
                page,
                pageSize,
                pageCount,
            }
        } catch (error) {
            console.error('获取用户列表失败:', error)
            throw new Error('获取用户列表失败')
        }
    },

    /**
     * 获取单个用户
     */
    async getById(id: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            })

            if (!user) {
                throw new Error('用户不存在')
            }

            return serializeAdminUser(user as any)
        } catch (error) {
            console.error('获取用户失败:', error)
            throw new Error('获取用户失败')
        }
    },

    /**
     * 创建用户
     */
    async create(input: CreateUserInput, headers?: Headers) {
        try {
            // 1. 使用 better-auth admin API 创建用户
            const result = await auth.api.createUser({
                headers,
                body: {
                    email: input.email,
                    password: input.password,
                    name: input.name,
                    role: input.role as any,
                    data: {
                        username: input.username,
                    },
                },
            })

            if (!result || !result.user) {
                throw new Error('创建认证用户失败')
            }

            const newUserId = result.user.id

            // 2. 更新额外信息（封禁状态等）
            const updated = await prisma.user.update({
                where: { id: newUserId },
                data: {
                    role: input.role,
                    banned: input.banned,
                    username: input.username ?? undefined,
                },
            })

            return serializeAdminUser(updated as any)
        } catch (error) {
            console.error('创建用户失败:', error)
            throw error instanceof Error ? error : new Error('创建用户失败')
        }
    },

    /**
     * 更新用户
     */
    async update(id: string, data: UpdateUserInput) {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            })

            if (!user) {
                throw new Error('用户不存在')
            }

            // 准备更新数据
            const updateData: any = {}
            if (data.name !== undefined) updateData.name = data.name
            if (data.username !== undefined) updateData.username = data.username
            if (data.role !== undefined) updateData.role = data.role
            if (data.banned !== undefined) updateData.banned = data.banned
            if (data.banReason !== undefined) updateData.banReason = data.banReason
            if (data.banExpires !== undefined) {
                updateData.banExpires = data.banExpires ? new Date(data.banExpires) : null
            }

            // 更新用户基本信息
            const updatedUser = await prisma.user.update({
                where: { id },
                data: updateData,
            })

            return serializeAdminUser(updatedUser as any)
        } catch (error) {
            console.error('更新用户失败:', error)
            throw error instanceof Error ? error : new Error('更新用户失败')
        }
    },

    /**
     * 删除用户
     */
    async delete(id: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            })

            if (!user) {
                throw new Error('用户不存在')
            }

            await prisma.$transaction(async (tx) => {
                await tx.session.deleteMany({ where: { userId: id } })
                await tx.account.deleteMany({ where: { userId: id } })
                await tx.member.deleteMany({ where: { userId: id } })
                await tx.user.delete({ where: { id } })
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除用户失败:', error)
            throw new Error('删除用户失败')
        }
    },

    /**
     * 批量删除用户
     */
    async bulkDelete(ids: string[]) {
        try {
            await prisma.$transaction(async (tx) => {
                await tx.session.deleteMany({ where: { userId: { in: ids } } })
                await tx.account.deleteMany({ where: { userId: { in: ids } } })
                await tx.member.deleteMany({ where: { userId: { in: ids } } })
                await tx.user.deleteMany({ where: { id: { in: ids } } })
            })

            return { success: true as const, count: ids.length }
        } catch (error) {
            console.error('批量删除用户失败:', error)
            throw new Error('批量删除用户失败')
        }
    },

    /**
     * 批量封禁用户
     */
    async bulkBan(ids: string[], banned: boolean, banReason?: string | null, banExpires?: string | null) {
        try {
            const updateData = banned
                ? {
                    banned: true,
                    banReason: banReason ?? null,
                    banExpires: banExpires ? new Date(banExpires) : null,
                }
                : {
                    banned: false,
                    banReason: null,
                    banExpires: null,
                }

            const result = await prisma.user.updateMany({
                where: { id: { in: ids } },
                data: updateData,
            })

            return { success: true as const, count: result.count }
        } catch (error) {
            console.error('批量封禁用户失败:', error)
            throw new Error('批量封禁用户失败')
        }
    },
}

export default UserService
