/**
 * Role Service - 纯业务逻辑层 (Prisma 实现)
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface ListRolesInput {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}

export interface CreateRoleInput {
    name: string
    label: string
    description?: string
    isSystem?: boolean
}

export interface UpdateRoleInput {
    name?: string
    label?: string
    description?: string | null
}

// ============ Service 实现 ============

export const RoleService = {
    /**
     * 获取角色列表（分页）
     */
    async getList(input: ListRolesInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '', sortBy, sortDir } = input

            const whereClause = filter
                ? {
                    OR: [
                        { name: { contains: filter } },
                        { label: { contains: filter } },
                        { description: { contains: filter } },
                    ],
                }
                : {}

            const [total, roles] = await Promise.all([
                prisma.systemRole.count({ where: whereClause }),
                prisma.systemRole.findMany({
                    where: whereClause,
                    orderBy: sortBy ? { [sortBy]: sortDir ?? 'asc' } : { name: 'asc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
            ])

            const pageCount = Math.ceil(total / pageSize)

            return {
                items: roles,
                total,
                page,
                pageSize,
                pageCount,
            }
        } catch (error) {
            console.error('获取角色列表失败:', error)
            throw new Error('获取角色列表失败')
        }
    },

    /**
     * 获取所有角色（不分页）
     */
    async getAll() {
        try {
            return await prisma.systemRole.findMany({
                orderBy: { name: 'asc' },
            })
        } catch (error) {
            console.error('获取角色列表失败:', error)
            throw new Error('获取角色列表失败')
        }
    },

    /**
     * 获取单个角色
     */
    async getById(id: string) {
        try {
            const role = await prisma.systemRole.findUnique({
                where: { id },
                include: {
                    navGroups: {
                        include: {
                            navGroup: true,
                        },
                    },
                },
            })

            if (!role) {
                throw new Error('角色不存在')
            }

            return role
        } catch (error) {
            console.error('获取角色失败:', error)
            throw new Error('获取角色失败')
        }
    },

    /**
     * 创建角色
     */
    async create(data: CreateRoleInput) {
        try {
            const existing = await prisma.systemRole.findUnique({
                where: { name: data.name },
            })

            if (existing) {
                throw new Error('角色标识已存在')
            }

            return await prisma.systemRole.create({
                data: {
                    name: data.name,
                    label: data.label,
                    description: data.description,
                    isSystem: data.isSystem ?? false,
                },
            })
        } catch (error) {
            console.error('创建角色失败:', error)
            throw error instanceof Error ? error : new Error('创建角色失败')
        }
    },

    /**
     * 更新角色
     */
    async update(id: string, data: UpdateRoleInput) {
        try {
            const role = await prisma.systemRole.findUnique({
                where: { id },
            })

            if (!role) {
                throw new Error('角色不存在')
            }

            if (role.isSystem && data.name && data.name !== role.name) {
                throw new Error('系统角色不能修改标识')
            }

            if (data.name && data.name !== role.name) {
                const existing = await prisma.systemRole.findUnique({
                    where: { name: data.name },
                })

                if (existing) {
                    throw new Error('角色标识已存在')
                }
            }

            return await prisma.systemRole.update({
                where: { id },
                data: {
                    name: data.name,
                    label: data.label,
                    description: data.description,
                },
            })
        } catch (error) {
            console.error('更新角色失败:', error)
            throw error instanceof Error ? error : new Error('更新角色失败')
        }
    },

    /**
     * 删除角色
     */
    async delete(id: string) {
        try {
            const role = await prisma.systemRole.findUnique({
                where: { id },
            })

            if (!role) {
                throw new Error('角色不存在')
            }

            if (role.isSystem) {
                throw new Error('系统角色不能删除')
            }

            await prisma.systemRole.delete({
                where: { id },
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除角色失败:', error)
            throw error instanceof Error ? error : new Error('删除角色失败')
        }
    },

    /**
     * 为角色分配导航组
     */
    async assignNavGroups(roleId: string, navGroupIds: string[]) {
        try {
            const role = await prisma.systemRole.findUnique({
                where: { id: roleId },
            })

            if (!role) {
                throw new Error('角色不存在')
            }

            return await prisma.$transaction(async (tx) => {
                // 1. 删除原有的关联
                await tx.roleNavGroup.deleteMany({
                    where: { roleId },
                })

                // 2. 创建新的关联
                if (navGroupIds.length > 0) {
                    await tx.roleNavGroup.createMany({
                        data: navGroupIds.map((navGroupId) => ({
                            roleId,
                            navGroupId,
                            roleName: role.name,
                        })),
                    })
                }

                return { success: true as const }
            })
        } catch (error) {
            console.error('分配导航组失败:', error)
            throw error instanceof Error ? error : new Error('分配导航组失败')
        }
    },
}

export default RoleService
