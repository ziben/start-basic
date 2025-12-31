/**
 * Organization ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListOrganizationsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

const CreateOrganizationSchema = z.object({
    name: z.string().min(1),
    slug: z.string().optional(),
    logo: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
})

const UpdateOrganizationSchema = z.object({
    id: z.string().min(1),
    name: z.string().optional(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    metadata: z.string().optional(),
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
 * 获取组织列表（分页）
 */
export const getOrganizationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListOrganizationsSchema>) =>
        data ? ListOrganizationsSchema.parse(data) : {}
    )
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.getList(data)
    })

/**
 * 获取单个组织
 */
export const getOrganizationFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.getById(data.id)
    })

/**
 * 创建组织
 */
export const createOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateOrganizationSchema>) =>
        CreateOrganizationSchema.parse(data)
    )
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.create(data)
    })

/**
 * 更新组织
 */
export const updateOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateOrganizationSchema>) =>
        UpdateOrganizationSchema.parse(data)
    )
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        const { id, ...updateData } = data
        return OrganizationService.update(id, updateData)
    })

/**
 * 删除组织
 */
export const deleteOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.delete(data.id)
    })

/**
 * 批量删除组织
 */
export const bulkDeleteOrganizationsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.bulkDelete(data.ids)
    })
