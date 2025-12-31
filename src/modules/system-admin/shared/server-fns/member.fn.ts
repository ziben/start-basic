/**
 * Member ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListMembersSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    organizationId: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

const CreateMemberSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
    role: z.string().min(1),
})

const UpdateMemberSchema = z.object({
    id: z.string().min(1),
    role: z.string().optional(),
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

export const getMembersFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListMembersSchema>) => (data ? ListMembersSchema.parse(data) : {}))
    .handler(async ({ data }) => {
        await requireAdmin()
        const { MemberService } = await import('../services/member.service')
        return MemberService.getList(data)
    })

export const createMemberFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof CreateMemberSchema>) => CreateMemberSchema.parse(data))
    .handler(async ({ data }) => {
        await requireAdmin()
        const { MemberService } = await import('../services/member.service')
        return MemberService.create(data)
    })

export const updateMemberFn = createServerFn({ method: 'POST' })
    .inputValidator((data: z.infer<typeof UpdateMemberSchema>) => UpdateMemberSchema.parse(data))
    .handler(async ({ data }) => {
        await requireAdmin()
        const { MemberService } = await import('../services/member.service')
        const { id, ...updateData } = data
        return MemberService.update(id, updateData)
    })

export const deleteMemberFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { MemberService } = await import('../services/member.service')
        return MemberService.delete(data.id)
    })

export const bulkDeleteMembersFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }) => {
        await requireAdmin()
        const { MemberService } = await import('../services/member.service')
        return MemberService.bulkDelete(data.ids)
    })
