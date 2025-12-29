import { z } from 'zod'
import { fetchJsonWithSchema } from '@/shared/lib/fetch-utils'

const adminLogsPageSchema = z.object({
  type: z.enum(['system', 'audit']),
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
})

export const logApi = {
  list: (params: {
    type: 'system' | 'audit'
    page: number
    pageSize: number
    filter?: string
    level?: 'debug' | 'info' | 'warn' | 'error'
    success?: boolean
    action?: string
    actorUserId?: string
    targetType?: string
    targetId?: string
    from?: string
    to?: string
    signal?: AbortSignal
  }) => {
    const query = new URLSearchParams()
    query.set('type', params.type)
    query.set('page', String(params.page))
    query.set('pageSize', String(params.pageSize))
    if (typeof params.filter === 'string' && params.filter.trim() !== '') query.set('filter', params.filter)
    if (params.level) query.set('level', params.level)
    if (typeof params.success === 'boolean') query.set('success', String(params.success))
    if (typeof params.action === 'string' && params.action.trim() !== '') query.set('action', params.action)
    if (typeof params.actorUserId === 'string' && params.actorUserId.trim() !== '')
      query.set('actorUserId', params.actorUserId)
    if (typeof params.targetType === 'string' && params.targetType.trim() !== '')
      query.set('targetType', params.targetType)
    if (typeof params.targetId === 'string' && params.targetId.trim() !== '') query.set('targetId', params.targetId)
    if (typeof params.from === 'string' && params.from.trim() !== '') query.set('from', params.from)
    if (typeof params.to === 'string' && params.to.trim() !== '') query.set('to', params.to)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return fetchJsonWithSchema(adminLogsPageSchema, `/api/admin/log/${suffix}`, { signal: params.signal })
  },
} as const
