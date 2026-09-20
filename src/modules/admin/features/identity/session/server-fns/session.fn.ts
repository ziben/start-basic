/**
 * Session ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/session.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { auth } from '~/modules/auth/shared/lib/auth'

// ============ Schema 定义 ============

const ListSessionsSchema = z.object({
  page: z.number().int().positive().max(100000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  filter: z.string().optional(),
  status: z.array(z.enum(['active', 'expired'])).optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  userId: z.string().optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取会话列表（分页）
 */
export const getSessionsFn = createServerFn({ method: 'GET' })
  .validator(ListSessionsSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListSessionsSchema> }) => {
    await requireAdmin('ListSessions')
    const { SessionService } = await import('../services/session.service')
    return SessionService.getList(data)
  })

/**
 * 批量删除会话
 */
export const bulkDeleteSessionsFn = createServerFn({ method: 'POST' })
  .validator(z.object({ ids: z.array(z.string().min(1)) }))
  .handler(async ({ data }: { data: { ids: string[] } }) => {
    await requireAdmin('BulkDeleteSessions')
    const { SessionService } = await import('../services/session.service')
    return SessionService.bulkDelete(data.ids)
  })

/**
 * 删除单个会话
 */
export const deleteSessionFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteSession')
    const { SessionService } = await import('../services/session.service')
    return SessionService.delete(data.id)
  })

/**
 * 撤销用户全部会话
 */
export const revokeUserSessionsFn = createServerFn({ method: 'POST' })
  .validator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }: { data: { userId: string } }) => {
    await requireAdmin('RevokeUserSessions')
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')

    await auth.api.admin.revokeUserSessions({
      headers: request.headers,
      body: {
        userId: data.userId,
      },
    })

    return { success: true as const }
  })
