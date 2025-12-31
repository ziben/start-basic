/**
 * NavGroup ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const CreateNavGroupSchema = z.object({
    title: z.string().min(1, '标题不能为空'),
    scope: z.enum(['APP', 'ADMIN']).optional(),
    orderIndex: z.number().optional(),
    roles: z.array(z.string()).optional(),
})

const UpdateNavGroupSchema = z.object({
    id: z.string().min(1),
    title: z.string().optional(),
    scope: z.enum(['APP', 'ADMIN']).optional(),
    orderIndex: z.number().optional(),
    roles: z.array(z.string()).optional(),
})

const UpdateOrderSchema = z.object({
    groupIds: z.array(z.string()),
})

const UpdateVisibilitySchema = z.object({
    userId: z.string().min(1),
    navGroupId: z.string().min(1),
    visible: z.boolean(),
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
 * 获取导航组列表
 */
export const getNavGroupsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: { scope?: 'APP' | 'ADMIN' }) => data)
    .handler(async ({ data }: { data?: { scope?: 'APP' | 'ADMIN' } }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.getAll(data?.scope)
    })

/**
 * 获取单个导航组
 */
export const getNavGroupFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.getById(data.id)
    })

/**
 * 创建导航组
 */
export const createNavGroupFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateNavGroupSchema>) => CreateNavGroupSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof CreateNavGroupSchema> }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.create(data)
    })

/**
 * 更新导航组
 */
export const updateNavGroupFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateNavGroupSchema>) => UpdateNavGroupSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateNavGroupSchema> }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        const { id, ...updateData } = data
        return NavGroupService.update(id, updateData)
    })

/**
 * 删除导航组
 */
export const deleteNavGroupFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.delete(data.id)
    })

/**
 * 更新排序
 */
export const updateNavGroupOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateOrderSchema>) => UpdateOrderSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateOrderSchema> }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.updateOrder(data.groupIds)
    })

/**
 * 更新用户导航组可见性
 */
export const updateNavGroupVisibilityFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateVisibilitySchema>) => UpdateVisibilitySchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof UpdateVisibilitySchema> }) => {
        await requireAdmin()
        const { NavGroupService } = await import('../services/navgroup.service')
        return NavGroupService.updateVisibility(data)
    })
