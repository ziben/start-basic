/**
 * Organization Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListOrganizationsInput {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface CreateOrganizationInput {
    name: string
    slug?: string
    logo?: string
    metadata?: string
}

export interface UpdateOrganizationInput {
    name?: string
    slug?: string
    logo?: string
    metadata?: string
}

export interface OrganizationItem {
    id: string
    name: string
    slug: string | null
    logo: string
    createdAt: string
    metadata: string
    memberCount: number
    invitationCount: number
}

// ============ 辅助函数 ============

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`

// ============ Service 实现 ============

export const OrganizationService = {
    /**
     * 获取组织列表（分页）
     */
    async getList(input: ListOrganizationsInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', sortBy, sortDir } = input

            const filterWhere = filter
                ? {
                    OR: [
                        { id: { contains: filter } },
                        { name: { contains: filter } },
                        { slug: { contains: filter } },
                    ],
                }
                : {}

            const [total, organizations] = await Promise.all([
                prisma.organization.count({ where: filterWhere }),
                prisma.organization.findMany({
                    where: filterWhere,
                    orderBy: sortBy ? { [sortBy]: sortDir ?? 'asc' } : { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        _count: {
                            select: {
                                members: true,
                                invitations: true,
                            },
                        },
                    },
                }),
            ])

            const items: OrganizationItem[] = organizations.map((org: any) => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo: org.logo ?? '',
                createdAt: org.createdAt.toISOString(),
                metadata: org.metadata ?? '',
                memberCount: org._count.members,
                invitationCount: org._count.invitations,
            }))

            const pageCount = Math.ceil(total / pageSize)
            return { items, total, page, pageSize, pageCount }
        } catch (error) {
            console.error('获取组织列表失败:', error)
            throw new Error('获取组织列表失败')
        }
    },

    /**
     * 获取单个组织
     */
    async getById(id: string) {
        try {
            const organization = await prisma.organization.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            members: true,
                            invitations: true,
                        },
                    },
                },
            })

            if (!organization) {
                throw new Error('组织不存在')
            }

            return {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                logo: organization.logo ?? '',
                createdAt: organization.createdAt.toISOString(),
                metadata: organization.metadata ?? '',
                memberCount: (organization as any)._count.members,
                invitationCount: (organization as any)._count.invitations,
            }
        } catch (error) {
            console.error('获取组织失败:', error)
            throw new Error('获取组织失败')
        }
    },

    /**
     * 创建组织
     */
    async create(input: CreateOrganizationInput) {
        try {
            const slug =
                input.slug ??
                input.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')

            const existing = await prisma.organization.findFirst({
                where: { slug },
            })
            if (existing) {
                throw new Error('已存在相同 slug 的组织')
            }

            const organization = await prisma.organization.create({
                data: {
                    id: generateId('org'),
                    createdAt: new Date(),
                    name: input.name,
                    slug,
                    logo: input.logo ?? '',
                    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
                },
                include: {
                    _count: {
                        select: {
                            members: true,
                            invitations: true,
                        },
                    },
                },
            })

            return {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                logo: organization.logo ?? '',
                createdAt: organization.createdAt.toISOString(),
                metadata: organization.metadata ?? '',
                memberCount: (organization as any)._count.members,
                invitationCount: (organization as any)._count.invitations,
            }
        } catch (error) {
            console.error('创建组织失败:', error)
            throw error instanceof Error ? error : new Error('创建组织失败')
        }
    },

    /**
     * 更新组织
     */
    async update(id: string, input: UpdateOrganizationInput) {
        try {
            const updated = await prisma.organization.update({
                where: { id },
                data: {
                    name: input.name,
                    slug: input.slug,
                    logo: input.logo,
                    metadata: input.metadata,
                },
                include: {
                    _count: {
                        select: {
                            members: true,
                            invitations: true,
                        },
                    },
                },
            })

            return {
                id: updated.id,
                name: updated.name,
                slug: updated.slug,
                logo: updated.logo ?? '',
                createdAt: updated.createdAt.toISOString(),
                metadata: updated.metadata ?? '',
                memberCount: (updated as any)._count.members,
                invitationCount: (updated as any)._count.invitations,
            }
        } catch (error) {
            console.error('更新组织失败:', error)
            throw error instanceof Error ? error : new Error('更新组织失败')
        }
    },

    /**
     * 删除组织
     */
    async delete(id: string) {
        try {
            await prisma.organization.delete({
                where: { id },
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除组织失败:', error)
            throw new Error('删除组织失败')
        }
    },

    /**
     * 批量删除组织
     */
    async bulkDelete(ids: string[]) {
        try {
            await prisma.organization.deleteMany({
                where: { id: { in: ids } },
            })

            return { success: true as const, count: ids.length }
        } catch (error) {
            console.error('批量删除组织失败:', error)
            throw new Error('批量删除组织失败')
        }
    },
}

export default OrganizationService
