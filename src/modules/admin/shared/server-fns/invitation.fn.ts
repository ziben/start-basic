/**
 * Invitation ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'

// ============ Schema 定义 ============

const ListInvitationsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    organizationId: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

const CreateInvitationSchema = z.object({
    organizationId: z.string().min(1),
    email: z.string().email(),
    role: z.string().min(1),
    expiresAt: z.string().optional(),
})

// ============ ServerFn 定义 ============

export const getInvitationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListInvitationsSchema>) =>
        data ? ListInvitationsSchema.parse(data) : {}
    )
    .handler(async ({ data }: { data: z.infer<typeof ListInvitationsSchema> }) => {
        await requireAdmin('ListInvitations')
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.getList(data)
    })

export const createInvitationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateInvitationSchema>) => CreateInvitationSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof CreateInvitationSchema> }) => {
        const user = await requireAdmin('CreateInvitation')
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.create({ ...data, inviterId: user.id })
    })

export const deleteInvitationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('DeleteInvitation')
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.delete(data.id)
    })

export const bulkDeleteInvitationsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }: { data: { ids: string[] } }) => {
        await requireAdmin('BulkDeleteInvitations')
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.bulkDelete(data.ids)
    })
