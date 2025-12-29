import { z } from 'zod'
import { fetchJsonWithSchema, fetchJson } from '@/shared/lib/fetch-utils'
import type { AdminSessionInfo } from '../types/session'

const makePageSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    pageCount: z.number(),
  })

const adminSessionInfoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  loginTime: z.string(),
  expiresAt: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  isActive: z.boolean(),
}) satisfies z.ZodType<AdminSessionInfo>

const adminSessionsPageSchema = makePageSchema(adminSessionInfoSchema)

export const sessionApi = {
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    status?: Array<'active' | 'expired'>
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    active?: boolean
    signal?: AbortSignal
  }) => {
    const query = new URLSearchParams()
    if (typeof params?.page === 'number') query.set('page', String(params.page))
    if (typeof params?.pageSize === 'number') query.set('pageSize', String(params.pageSize))
    if (typeof params?.filter === 'string' && params.filter.trim() !== '') query.set('filter', params.filter)
    if (Array.isArray(params?.status) && params.status.length > 0) {
      for (const s of params.status) query.append('status', s)
    }
    if (typeof params?.sortBy === 'string' && params.sortBy.trim() !== '') query.set('sortBy', params.sortBy)
    if (typeof params?.sortBy === 'string' && params.sortBy.trim() !== '' && params?.sortDir) {
      query.set('sortDir', params.sortDir)
    }
    if (typeof params?.active === 'boolean') query.set('active', String(params.active))

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return fetchJsonWithSchema(adminSessionsPageSchema, `/api/admin/session/${suffix}`, { signal: params?.signal })
  },
  remove: (id: string) =>
    fetchJson<{ success: true; id: string }>(`/api/admin/session/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  bulkDelete: (data: { ids: string[] }) =>
    fetchJson<{ count: number }>('/api/admin/session/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
} as const
