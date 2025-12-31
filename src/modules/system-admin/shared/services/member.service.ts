/**
 * Member Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListMembersInput {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface CreateMemberInput {
    organizationId: string
    userId: string
    role: string
}

export interface UpdateMemberInput {
    role?: string
}

export interface MemberItem {
    id: string
    userId: string
    username: string
    email: string
    organizationId: string
    organizationName: string
    organizationSlug: string
    role: string
    createdAt: string
}

// ============ 辅助函数 ============

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`

// ============ Service 实现 ============

export const MemberService = {
    /**
     * 获取成员列表（分页）
     */
    async getList(input: ListMembersInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', organizationId, sortBy, sortDir } = input

            const filterWhere = filter
                ? {
                    OR: [
                        { id: { contains: filter } },
                        { role: { contains: filter } },
                        {
                            user: {
                                OR: [{ name: { contains: filter } }, { email: { contains: filter } }],
                            },
                        },
                        {
                            organization: {
                                OR: [{ name: { contains: filter } }, { slug: { contains: filter } }],
                            },
                        },
                    ],
                }
                : {}

            const where = {
                ...filterWhere,
                ...(organizationId && { organizationId }),
            }

            const [total, members] = await Promise.all([
                prisma.member.count({ where }),
                prisma.member.findMany({
                    where,
                    orderBy: sortBy ? { [sortBy]: sortDir ?? 'asc' } : { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                        organization: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                }),
            ])

            const items: MemberItem[] = members.map((member: any) => ({
                id: member.id,
                userId: member.userId,
                username: member.user?.name ?? '',
                email: member.user?.email ?? '',
                organizationId: member.organizationId,
                organizationName: member.organization?.name ?? '',
                organizationSlug: member.organization?.slug ?? '',
                role: member.role,
                createdAt: member.createdAt.toISOString(),
            }))

            const pageCount = Math.ceil(total / pageSize)
            return { items, total, page, pageSize, pageCount }
        } catch (error) {
            console.error('获取成员列表失败:', error)
            throw new Error('获取成员列表失败')
        }
    },

    /**
     * 创建成员
     */
    async create(input: CreateMemberInput) {
        try {
            const existing = await prisma.member.findFirst({
                where: {
                    organizationId: input.organizationId,
                    userId: input.userId,
                },
            })
            if (existing) {
                throw new Error('用户已经是该组织的成员')
            }

            const member = await prisma.member.create({
                data: {
                    id: generateId('mem'),
                    createdAt: new Date(),
                    organizationId: input.organizationId,
                    userId: input.userId,
                    role: input.role,
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    organization: { select: { id: true, name: true, slug: true } },
                },
            })

            const mem: any = member
            return {
                id: mem.id,
                userId: mem.userId,
                username: mem.user?.name ?? '',
                email: mem.user?.email ?? '',
                organizationId: mem.organizationId,
                organizationName: mem.organization?.name ?? '',
                organizationSlug: mem.organization?.slug ?? '',
                role: mem.role,
                createdAt: mem.createdAt.toISOString(),
            }
        } catch (error) {
            console.error('创建成员失败:', error)
            throw error instanceof Error ? error : new Error('创建成员失败')
        }
    },

    /**
     * 更新成员
     */
    async update(id: string, input: UpdateMemberInput) {
        try {
            const member = await prisma.member.update({
                where: { id },
                data: { role: input.role },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    organization: { select: { id: true, name: true, slug: true } },
                },
            })

            const mem: any = member
            return {
                id: mem.id,
                userId: mem.userId,
                username: mem.user?.name ?? '',
                email: mem.user?.email ?? '',
                organizationId: mem.organizationId,
                organizationName: mem.organization?.name ?? '',
                organizationSlug: mem.organization?.slug ?? '',
                role: mem.role,
                createdAt: mem.createdAt.toISOString(),
            }
        } catch (error) {
            console.error('更新成员失败:', error)
            throw new Error('更新成员失败')
        }
    },

    /**
     * 删除成员
     */
    async delete(id: string) {
        try {
            await prisma.member.delete({ where: { id } })
            return { success: true as const, id }
        } catch (error) {
            console.error('删除成员失败:', error)
            throw new Error('删除成员失败')
        }
    },

    /**
     * 批量删除成员
     */
    async bulkDelete(ids: string[]) {
        try {
            await prisma.member.deleteMany({ where: { id: { in: ids } } })
            return { success: true as const, count: ids.length }
        } catch (error) {
            console.error('批量删除成员失败:', error)
            throw new Error('批量删除成员失败')
        }
    },
}

export default MemberService
