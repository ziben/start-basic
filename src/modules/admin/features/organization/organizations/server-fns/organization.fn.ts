/**
 * Organization ServerFn - 服务器函数层
 *
 * [迁移自 admin/shared/server-fns/organization.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const ListOrganizationsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

const CreateOrganizationSchema = z.object({
    name: z.string().min(1, '组织名称不能为空'),
    slug: z.string().optional(),
    logo: z.string().optional(),
    metadata: z.string().optional(),
})

const UpdateOrganizationSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, '组织名称不能为空').optional(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    metadata: z.string().optional(),
})

// ============ ServerFn 定义 ============

export const getOrganizationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListOrganizationsSchema>) =>
        data ? ListOrganizationsSchema.parse(data) : {}
    )
    .handler(async ({ data }: { data: z.infer<typeof ListOrganizationsSchema> }) => {
        await requireAdmin('ListOrganizations')
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.getList(data)
    })

export const getOrganizationFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('GetOrganizationDetail')
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.getById(data.id)
    })

export const createOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateOrganizationSchema>) =>
        CreateOrganizationSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof CreateOrganizationSchema> }) => {
        await requireAdmin('CreateOrganization')
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.create(data)
    })

export const updateOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateOrganizationSchema>) =>
        UpdateOrganizationSchema.parse(data)
    )
    .handler(async ({ data }: { data: z.infer<typeof UpdateOrganizationSchema> }) => {
        await requireAdmin('UpdateOrganization')
        const { OrganizationService } = await import('../services/organization.service')
        const { id, ...updateData } = data
        return OrganizationService.update(id, updateData)
    })

export const deleteOrganizationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('DeleteOrganization')
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.delete(data.id)
    })

export const bulkDeleteOrganizationsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }: { data: { ids: string[] } }) => {
        await requireAdmin('BulkDeleteOrganizations')
        const { OrganizationService } = await import('../services/organization.service')
        return OrganizationService.bulkDelete(data.ids)
    })
