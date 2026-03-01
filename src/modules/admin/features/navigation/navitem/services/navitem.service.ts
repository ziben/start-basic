/**
 * NavItem Service - 纯业务逻辑层 (Prisma 实现)
 * [迁移自 admin/shared/services/navitem.service.ts]
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface CreateNavItemInput {
    title: string
    url?: string
    icon?: string
    badge?: string
    isCollapsible?: boolean
    navGroupId: string
    parentId?: string
    orderIndex?: number
}

export interface UpdateNavItemInput {
    title?: string
    url?: string
    icon?: string
    badge?: string
    isCollapsible?: boolean
    navGroupId?: string
    parentId?: string
    orderIndex?: number
}

// 通用的 include 配置
const navItemInclude = {
    children: {
        orderBy: { orderIndex: 'asc' as const },
        include: {
            children: {
                orderBy: { orderIndex: 'asc' as const },
            },
        },
    },
}

// ============ 辅助函数 ============

function buildNavItemUpdateData(
    currentItem: { isCollapsible: boolean; parentId: string | null },
    data: UpdateNavItemInput
) {
    const updateData: Record<string, any> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.badge !== undefined) updateData.badge = data.badge
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex
    if (data.navGroupId !== undefined) updateData.navGroupId = data.navGroupId

    if (data.isCollapsible !== undefined) {
        updateData.isCollapsible = data.isCollapsible
        if (data.isCollapsible === true && currentItem.isCollapsible === false) {
            updateData.url = null
        }
    }

    const isCollapsibleAfter =
        updateData.isCollapsible !== undefined ? Boolean(updateData.isCollapsible) : currentItem.isCollapsible

    if (data.url !== undefined && isCollapsibleAfter === false) {
        updateData.url = data.url
    }

    return updateData
}

async function validateAndUpdateParentNavItem(params: {
    id: string
    currentParentId: string | null
    nextParentId: string | undefined
}) {
    const { id, currentParentId, nextParentId } = params

    if (nextParentId === undefined || nextParentId === currentParentId) {
        return
    }

    if (!nextParentId) {
        return
    }

    const parentItem = await prisma.navItem.findUnique({
        where: { id: nextParentId },
    })

    if (!parentItem) {
        throw new Error('父级导航项不存在')
    }

    if (id === nextParentId) {
        throw new Error('不能将导航项作为自己的父级')
    }

    await prisma.navItem.update({
        where: { id: nextParentId },
        data: { isCollapsible: true },
    })
}

// ============ Service 实现 ============

export const NavItemService = {
    /**
     * 获取所有导航项
     */
    async getAll(navGroupId?: string, scope?: 'APP' | 'ADMIN') {
        try {
            const whereClause: Record<string, any> = {}
            if (navGroupId) {
                whereClause.navGroupId = navGroupId
            }
            if (scope) {
                whereClause.navGroup = { scope }
            }

            return await prisma.navItem.findMany({
                where: whereClause,
                orderBy: [{ navGroupId: 'asc' }, { orderIndex: 'asc' }],
                include: navItemInclude,
            })
        } catch (error) {
            console.error('获取导航项失败:', error)
            throw new Error('获取导航项失败')
        }
    },

    /**
     * 获取单个导航项
     */
    async getById(id: string) {
        try {
            const navItem = await prisma.navItem.findUnique({
                where: { id },
                include: navItemInclude,
            })

            if (!navItem) {
                throw new Error('导航项不存在')
            }

            return navItem
        } catch (error) {
            console.error('获取导航项失败:', error)
            throw new Error('获取导航项失败')
        }
    },

    /**
     * 创建导航项
     */
    async create(data: CreateNavItemInput) {
        try {
            const normalized = {
                ...data,
                navGroupId: data.navGroupId?.trim() || '',
                parentId: data.parentId?.trim() || undefined,
            }

            if (!normalized.navGroupId) {
                throw new Error('菜单组ID不能为空')
            }

            // 获取最大 orderIndex
            let orderIndex = normalized.orderIndex
            if (orderIndex === undefined) {
                const whereClause: any = normalized.parentId
                    ? { parentId: normalized.parentId }
                    : { navGroupId: normalized.navGroupId, parentId: null }

                const lastNavItem = await prisma.navItem.findFirst({
                    where: whereClause,
                    orderBy: { orderIndex: 'desc' },
                })
                orderIndex = lastNavItem ? lastNavItem.orderIndex + 1 : 0
            }

            // 验证父级导航项
            if (normalized.parentId) {
                const parentItem = await prisma.navItem.findUnique({
                    where: { id: normalized.parentId },
                })

                if (!parentItem) {
                    throw new Error('父级导航项不存在')
                }

                if (!parentItem.isCollapsible) {
                    throw new Error('父级必须是可折叠菜单')
                }

                // 更新父项为可折叠
                await prisma.navItem.update({
                    where: { id: normalized.parentId },
                    data: { isCollapsible: true },
                })
            }

            // 创建导航项
            return await prisma.navItem.create({
                data: {
                    title: normalized.title,
                    url: normalized.isCollapsible ? null : normalized.url,
                    icon: normalized.icon,
                    badge: normalized.badge,
                    isCollapsible: !!normalized.isCollapsible,
                    orderIndex: orderIndex ?? 0,
                    navGroupId: normalized.navGroupId,
                    parentId: normalized.parentId,
                },
            })
        } catch (error) {
            console.error('创建导航项失败:', error)
            throw new Error('创建导航项失败')
        }
    },

    /**
     * 更新导航项
     */
    async update(id: string, data: UpdateNavItemInput) {
        try {
            // 查找当前导航项
            const currentItem = await prisma.navItem.findUnique({
                where: { id },
                include: { children: true },
            })

            if (!currentItem) {
                throw new Error('导航项不存在')
            }

            const updateData = buildNavItemUpdateData(currentItem, data)
            await validateAndUpdateParentNavItem({
                id,
                currentParentId: currentItem.parentId,
                nextParentId: data.parentId,
            })

            if (data.parentId !== undefined && data.parentId !== currentItem.parentId) {
                updateData.parentId = data.parentId
            }

            // 更新导航项
            return await prisma.navItem.update({
                where: { id },
                data: updateData,
            })
        } catch (error) {
            console.error('更新导航项失败:', error)
            throw new Error('更新导航项失败')
        }
    },

    /**
     * 删除导航项
     */
    async delete(id: string) {
        try {
            const navItem = await prisma.navItem.findUnique({
                where: { id },
            })

            if (!navItem) {
                throw new Error('导航项不存在')
            }

            await prisma.navItem.delete({
                where: { id },
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除导航项失败:', error)
            throw new Error('删除导航项失败')
        }
    },

    /**
     * 更新排序
     */
    async updateOrder(itemIds: string[]) {
        try {
            await prisma.$transaction(
                itemIds.map((id, index) =>
                    prisma.navItem.update({
                        where: { id },
                        data: { orderIndex: index },
                    })
                )
            )
            return { success: true as const }
        } catch (error) {
            console.error('更新导航项顺序失败:', error)
            throw new Error('更新导航项顺序失败')
        }
    },

    /**
     * 切换可见性
     */
    async toggleVisibility(id: string, isVisible: boolean) {
        try {
            const navItem = await prisma.navItem.findUnique({
                where: { id },
            })

            if (!navItem) {
                throw new Error('导航项不存在')
            }

            await prisma.navItem.update({
                where: { id },
                data: {
                    badge: isVisible ? null : '隐藏',
                },
            })

            return { success: true as const, isVisible, id }
        } catch (error) {
            console.error('更新导航项可见性失败:', error)
            throw new Error('更新导航项可见性失败')
        }
    },
}

export default NavItemService
