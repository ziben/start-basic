/**
 * Invitation ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

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

// ============ 认证辅助函数 ============

async function requireAdmin() {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/identity/shared/lib/auth')

    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw new Error('未登录')

    const adminRoles = ['admin', 'superadmin']
    if (!adminRoles.includes(session.user.role || '')) throw new Error('无权限访问')

    return session.user
}

// ============ ServerFn 定义 ============

export const getInvitationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListInvitationsSchema>) =>
        data ? ListInvitationsSchema.parse(data) : {}
    )
    .handler(async ({ data }) => {
        await requireAdmin()
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.getList(data)
    })

export const createInvitationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateInvitationSchema>) => CreateInvitationSchema.parse(data))
    .handler(async ({ data }) => {
        const user = await requireAdmin()
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.create({ ...data, inviterId: user.id })
    })

export const deleteInvitationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.delete(data.id)
    })

export const bulkDeleteInvitationsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { InvitationService } = await import('../services/invitation.service')
        return InvitationService.bulkDelete(data.ids)
    })
