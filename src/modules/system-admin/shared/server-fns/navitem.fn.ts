/**
 * NavItem ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const CreateNavItemSchema = z.object({
    title: z.string().min(1, '标题不能为空'),
    url: z.string().optional(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    isCollapsible: z.boolean().optional(),
    navGroupId: z.string().min(1, '导航组ID不能为空'),
    parentId: z.string().optional(),
    orderIndex: z.number().optional(),
})

const UpdateNavItemSchema = z.object({
    id: z.string().min(1),
    title: z.string().optional(),
    url: z.string().optional(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    isCollapsible: z.boolean().optional(),
    navGroupId: z.string().optional(),
    parentId: z.string().optional(),
    orderIndex: z.number().optional(),
})

// ============ 认证辅助函数 ============

async function requireAdmin() {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/identity/shared/lib/auth')

    const request = getRequest()
    if (!request) {
        throw new Error('无法获取请求信息')
    }

    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
        throw new Error('未登录')
    }

    const adminRoles = ['admin', 'superadmin']
    if (!adminRoles.includes(session.user.role || '')) {
        throw new Error('无权限访问')
    }

    return session.user
}

// ============ ServerFn 定义 ============

/**
 * 获取导航项列表
 */
export const getNavItemsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: { navGroupId?: string; scope?: 'APP' | 'ADMIN' }) => data)
    .handler(async ({ data }: { data?: { navGroupId?: string; scope?: 'APP' | 'ADMIN' } }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.getAll(data?.navGroupId, data?.scope)
    })

/**
 * 获取单个导航项
 */
export const getNavItemFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.getById(data.id)
    })

/**
 * 创建导航项
 */
export const createNavItemFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateNavItemSchema>) => CreateNavItemSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof CreateNavItemSchema> }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.create(data)
    })

/**
 * 更新导航项
 */
export const updateNavItemFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateNavItemSchema>) => UpdateNavItemSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateNavItemSchema> }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        const { id, ...updateData } = data
        return NavItemService.update(id, updateData)
    })

/**
 * 删除导航项
 */
export const deleteNavItemFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.delete(data.id)
    })

/**
 * 更新排序
 */
export const updateNavItemOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { itemIds: string[] }) => {
        if (!data?.itemIds || !Array.isArray(data.itemIds)) {
            throw new Error('itemIds 必须是数组')
        }
        return data
    })
    .handler(async ({ data }: { data: { itemIds: string[] } }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.updateOrder(data.itemIds)
    })

/**
 * 切换导航项可见性
 */
export const toggleNavItemVisibilityFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; isVisible: boolean }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        if (typeof data.isVisible !== 'boolean') throw new Error('isVisible 必须是布尔值')
        return data
    })
    .handler(async ({ data }: { data: { id: string; isVisible: boolean } }) => {
        await requireAdmin()
        const { NavItemService } = await import('../services/navitem.service')
        return NavItemService.toggleVisibility(data.id, data.isVisible)
    })
