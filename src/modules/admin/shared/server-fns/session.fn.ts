/**
 * Session ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'

// ============ Schema 定义 ============

const ListSessionsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    status: z.array(z.enum(['active', 'expired'])).optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

// ============ ServerFn 定义 ============

/**
 * 获取会话列表（分页）
 */
export const getSessionsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListSessionsSchema>) => (data ? ListSessionsSchema.parse(data) : {}))
    .handler(async ({ data }: { data: z.infer<typeof ListSessionsSchema> }) => {
        await requireAdmin('ListSessions')
        const { SessionService } = await import('../services/session.service')
        return SessionService.getList(data)
    })

/**
 * 批量删除会话
 */
export const bulkDeleteSessionsFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { ids: string[] }) => {
        if (!data?.ids || !Array.isArray(data.ids)) throw new Error('ids 必须是数组')
        return data
    })
    .handler(async ({ data }: { data: { ids: string[] } }) => {
        await requireAdmin('BulkDeleteSessions')
        const { SessionService } = await import('../services/session.service')
        return SessionService.bulkDelete(data.ids)
    })

/**
 * 删除单个会话
 */
export const deleteSessionFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string }) => {
        if (!data?.id) throw new Error('ID 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { id: string } }) => {
        await requireAdmin('DeleteSession')
        const { SessionService } = await import('../services/session.service')
        return SessionService.delete(data.id)
    })
