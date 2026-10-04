/**
 * Member ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/member.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const ListMembersSchema = z.object({
  page: z.number().int().positive().max(100000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
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

// ============ ServerFn 定义 ============

export const getMembersFn = createServerFn({ method: 'GET' })
  .validator(ListMembersSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListMembersSchema> }) => {
    await requireAdmin('ListMembers')
    const { MemberService } = await import('../services/member.service')
    return MemberService.getList(data)
  })

export const createMemberFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateMemberSchema>) => CreateMemberSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateMemberSchema> }) => {
    await requireAdmin('CreateMember')
    const { MemberService } = await import('../services/member.service')
    return MemberService.create(data)
  })

export const updateMemberFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateMemberSchema>) => UpdateMemberSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateMemberSchema> }) => {
    await requireAdmin('UpdateMember')
    const { MemberService } = await import('../services/member.service')
    const { id, ...updateData } = data
    return MemberService.update(id, updateData)
  })

export const deleteMemberFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteMember')
    const { MemberService } = await import('../services/member.service')
    return MemberService.delete(data.id)
  })

export const bulkDeleteMembersFn = createServerFn({ method: 'POST' })
  .validator(z.object({ ids: z.array(z.string().min(1)) }))
  .handler(async ({ data }: { data: { ids: string[] } }) => {
    await requireAdmin('BulkDeleteMembers')
    const { MemberService } = await import('../services/member.service')
    return MemberService.bulkDelete(data.ids)
  })
