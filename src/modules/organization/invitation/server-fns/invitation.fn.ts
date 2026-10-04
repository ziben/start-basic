/**
 * Invitation ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/invitation.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const ListInvitationsSchema = z.object({
  page: z.number().int().positive().max(100000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
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
  .validator(ListInvitationsSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListInvitationsSchema> }) => {
    await requireAdmin('ListInvitations')
    const { InvitationService } = await import('../services/invitation.service')
    return InvitationService.getList(data)
  })

export const createInvitationFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateInvitationSchema>) => CreateInvitationSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateInvitationSchema> }) => {
    const user = await requireAdmin('CreateInvitation')
    const { InvitationService } = await import('../services/invitation.service')
    return InvitationService.create({ ...data, inviterId: user.id })
  })

export const deleteInvitationFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteInvitation')
    const { InvitationService } = await import('../services/invitation.service')
    return InvitationService.delete(data.id)
  })

export const bulkDeleteInvitationsFn = createServerFn({ method: 'POST' })
  .validator(z.object({ ids: z.array(z.string().min(1)) }))
  .handler(async ({ data }: { data: { ids: string[] } }) => {
    await requireAdmin('BulkDeleteInvitations')
    const { InvitationService } = await import('../services/invitation.service')
    return InvitationService.bulkDelete(data.ids)
  })
