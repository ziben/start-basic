/**
 * Invitation Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListInvitationsInput {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    status?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface CreateInvitationInput {
    organizationId: string
    email: string
    role: string
    expiresAt?: string
    inviterId: string
}

export interface InvitationItem {
    id: string
    email: string
    organizationId: string
    organizationName: string
    organizationSlug: string
    role: string | null
    status: string
    createdAt: string | null
    expiresAt: string | null
}

// ============ 辅助函数 ============

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`

// ============ Service 实现 ============

export const InvitationService = {
    /**
     * 获取邀请列表（分页）
     */
    async getList(input: ListInvitationsInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', organizationId, status, sortBy, sortDir } = input

            const filterWhere = filter
                ? {
                    OR: [
                        { id: { contains: filter } },
                        { email: { contains: filter } },
                        { role: { contains: filter } },
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
                ...(status ? { status } : {}),
                ...(organizationId && { organizationId }),
            }

            const [total, invitations] = await Promise.all([
                prisma.invitation.count({ where }),
                prisma.invitation.findMany({
                    where,
                    orderBy: sortBy ? { [sortBy]: sortDir ?? 'asc' } : { expiresAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        organization: { select: { id: true, name: true, slug: true } },
                    },
                }),
            ])

            const items: InvitationItem[] = invitations.map((inv: any) => ({
                id: inv.id,
                email: inv.email,
                organizationId: inv.organizationId,
                organizationName: inv.organization?.name ?? '',
                organizationSlug: inv.organization?.slug ?? '',
                role: inv.role,
                status: inv.status,
                createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : null,
                expiresAt: inv.expiresAt ? new Date(inv.expiresAt).toISOString() : null,
            }))

            const pageCount = Math.ceil(total / pageSize)
            return { items, total, page, pageSize, pageCount }
        } catch (error) {
            console.error('获取邀请列表失败:', error)
            throw new Error('获取邀请列表失败')
        }
    },

    /**
     * 创建邀请
     */
    async create(input: CreateInvitationInput) {
        try {
            const existing = await prisma.invitation.findFirst({
                where: {
                    organizationId: input.organizationId,
                    email: input.email,
                    status: 'pending',
                },
            })
            if (existing) {
                throw new Error('该邮箱已有待处理的邀请')
            }

            const invitation = await prisma.invitation.create({
                data: {
                    id: generateId('inv'),
                    organizationId: input.organizationId,
                    email: input.email,
                    role: input.role,
                    status: 'pending',
                    inviterId: input.inviterId,
                    expiresAt: input.expiresAt
                        ? new Date(input.expiresAt)
                        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                },
            })

            const inv: any = invitation
            return {
                id: inv.id,
                email: inv.email,
                organizationId: inv.organizationId,
                organizationName: inv.organization?.name ?? '',
                organizationSlug: inv.organization?.slug ?? '',
                role: inv.role,
                status: inv.status,
                createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : null,
                expiresAt: inv.expiresAt ? new Date(inv.expiresAt).toISOString() : null,
            }
        } catch (error) {
            console.error('创建邀请失败:', error)
            throw error instanceof Error ? error : new Error('创建邀请失败')
        }
    },

    /**
     * 删除邀请
     */
    async delete(id: string) {
        try {
            await prisma.invitation.delete({ where: { id } })
            return { success: true as const, id }
        } catch (error) {
            console.error('删除邀请失败:', error)
            throw new Error('删除邀请失败')
        }
    },

    /**
     * 批量删除邀请
     */
    async bulkDelete(ids: string[]) {
        try {
            await prisma.invitation.deleteMany({ where: { id: { in: ids } } })
            return { success: true as const, count: ids.length }
        } catch (error) {
            console.error('批量删除邀请失败:', error)
            throw new Error('批量删除邀请失败')
        }
    },
}

export default InvitationService
