/**
 * NavGroup Service - 纯业务逻辑层 (Prisma 实现)
 * [迁移自 admin/shared/services/navgroup.service.ts]
 */

import prisma from '@/shared/lib/db'

// Prisma 事务客户端类型
type TransactionClient = Omit<
    typeof prisma,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// 通用的 include 配置
const navGroupInclude = {
    navItems: {
        orderBy: { orderIndex: 'asc' as const },
    },
    roleNavGroups: true,
}

// ============ 类型定义 ============

export interface CreateNavGroupInput {
    title: string
    scope?: 'APP' | 'ADMIN'
    orderIndex?: number
    roles?: string[]
}

export interface UpdateNavGroupInput {
    title?: string
    scope?: 'APP' | 'ADMIN'
    orderIndex?: number
    roles?: string[]
}

export interface UpdateVisibilityInput {
    userId: string
    navGroupId: string
    visible: boolean
}

// ============ Service 实现 ============

export const NavGroupService = {
    /**
     * 获取所有菜单组
     */
    async getAll(scope?: 'APP' | 'ADMIN') {
        try {
            return await prisma.navGroup.findMany({
                where: scope ? { scope } : undefined,
                orderBy: { orderIndex: 'asc' },
                include: navGroupInclude,
            })
        } catch (error) {
            console.error('获取菜单组失败:', error)
            throw new Error('获取菜单组失败')
        }
    },

    /**
     * 获取单个菜单组
     */
    async getById(id: string) {
        try {
            const navGroup = await prisma.navGroup.findUnique({
                where: { id },
                include: navGroupInclude,
            })

            if (!navGroup) {
                throw new Error('菜单组不存在')
            }

            return navGroup
        } catch (error) {
            console.error('获取菜单组失败:', error)
            throw new Error('获取菜单组失败')
        }
    },

    /**
     * 创建菜单组
     */
    async create(data: CreateNavGroupInput) {
        try {
            // 获取最大 orderIndex
            let orderIndex = data.orderIndex
            if (orderIndex === undefined) {
                const lastNavGroup = await prisma.navGroup.findFirst({
                    orderBy: { orderIndex: 'desc' },
                })
                orderIndex = lastNavGroup ? lastNavGroup.orderIndex + 1 : 0
            }

            return await prisma.$transaction(async (tx: TransactionClient) => {
                // 创建菜单组
                const group = await tx.navGroup.create({
                    data: {
                        title: data.title,
                        scope: data.scope ?? 'APP',
                        orderIndex,
                    },
                })

                // 创建角色关联
                if (data.roles && data.roles.length > 0) {
                    await tx.roleNavGroup.createMany({
                        data: data.roles.map((roleName) => ({
                            roleName,
                            navGroupId: group.id,
                        })),
                    })
                } else {
                    // 默认所有内置角色可见
                    const roles = await tx.role.findMany({
                        where: { name: { in: ['user', 'admin'] } }
                    })
                    if (roles.length > 0) {
                        await tx.roleNavGroup.createMany({
                            data: roles.map((r) => ({
                                roleName: r.name,
                                navGroupId: group.id,
                            })),
                        })
                    }
                }

                // 返回完整对象
                return tx.navGroup.findUnique({
                    where: { id: group.id },
                    include: navGroupInclude,
                })
            })
        } catch (error) {
            console.error('创建菜单组失败:', error)
            throw new Error('创建菜单组失败')
        }
    },

    /**
     * 更新菜单组
     */
    async update(id: string, data: UpdateNavGroupInput) {
        try {
            return await prisma.$transaction(async (tx: TransactionClient) => {
                // 更新基本信息
                const updateData: Record<string, any> = {}
                if (data.title !== undefined) updateData.title = data.title
                if (data.scope !== undefined) updateData.scope = data.scope
                if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

                if (Object.keys(updateData).length > 0) {
                    await tx.navGroup.update({
                        where: { id },
                        data: updateData,
                    })
                }

                // 更新角色关联
                if (data.roles !== undefined) {
                    await tx.roleNavGroup.deleteMany({
                        where: { navGroupId: id },
                    })

                    if (data.roles.length > 0) {
                        await tx.roleNavGroup.createMany({
                            data: data.roles.map((roleName) => ({
                                roleName,
                                navGroupId: id,
                            })),
                        })
                    }
                }

                // 返回最新对象
                return tx.navGroup.findUnique({
                    where: { id },
                    include: navGroupInclude,
                })
            })
        } catch (error) {
            console.error('更新菜单组失败:', error)
            throw new Error('更新菜单组失败')
        }
    },

    /**
     * 删除菜单组
     */
    async delete(id: string) {
        try {
            const navGroup = await prisma.navGroup.findUnique({
                where: { id },
            })

            if (!navGroup) {
                throw new Error('菜单组不存在')
            }

            await prisma.$transaction(async (tx: TransactionClient) => {
                await tx.roleNavGroup.deleteMany({ where: { navGroupId: id } })
                await tx.userRoleNavGroup.deleteMany({ where: { navGroupId: id } })
                await tx.navGroup.delete({ where: { id } })
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除菜单组失败:', error)
            throw new Error('删除菜单组失败')
        }
    },

    /**
     * 更新排序
     */
    async updateOrder(groupIds: string[]) {
        try {
            await prisma.$transaction(
                groupIds.map((id, index) =>
                    prisma.navGroup.update({
                        where: { id },
                        data: { orderIndex: index },
                    })
                )
            )
            return { success: true as const }
        } catch (error) {
            console.error('更新菜单组顺序失败:', error)
            throw new Error('更新菜单组顺序失败')
        }
    },

    /**
     * 更新用户个性化菜单组可见性
     */
    async updateVisibility(data: UpdateVisibilityInput) {
        try {
            const existing = await prisma.userRoleNavGroup.findFirst({
                where: {
                    userId: data.userId,
                    navGroupId: data.navGroupId,
                },
            })

            if (existing) {
                return await prisma.userRoleNavGroup.update({
                    where: { id: existing.id },
                    data: { visible: data.visible },
                })
            } else {
                return await prisma.userRoleNavGroup.create({
                    data: {
                        userId: data.userId,
                        navGroupId: data.navGroupId,
                        visible: data.visible,
                    },
                })
            }
        } catch (error) {
            console.error('更新用户菜单组可见性失败:', error)
            throw new Error('更新用户菜单组可见性失败')
        }
    },
}

export default NavGroupService
