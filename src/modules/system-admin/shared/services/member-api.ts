import { z } from 'zod'
import { fetchJsonWithSchema, fetchJson } from '@/shared/lib/fetch-utils'
import type { AdminMemberInfo } from '../types/member'

const makePageSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    pageCount: z.number(),
  })

const adminMemberInfoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<AdminMemberInfo>

const adminMembersPageSchema = makePageSchema(adminMemberInfoSchema)

export const memberApi = {
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    sortBy?: string
    sortDir?: string
    signal?: AbortSignal
  }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.pageSize) search.set('pageSize', String(params.pageSize))
    if (params?.filter) search.set('filter', params.filter)
    if (params?.organizationId) search.set('organizationId', params.organizationId)
    if (params?.sortBy) search.set('sortBy', params.sortBy)
    if (params?.sortDir) search.set('sortDir', params.sortDir)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    return fetchJsonWithSchema(adminMembersPageSchema, `/api/admin/member/${suffix}`, { signal: params?.signal })
  },
  get: (id: string) => fetchJson<AdminMemberInfo>(`/api/admin/member/${encodeURIComponent(id)}`),
  create: (data: { organizationId: string; userId: string; role: string }) =>
    fetchJson<AdminMemberInfo>('/api/admin/member/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { role?: string }) =>
    fetchJson<AdminMemberInfo>(`/api/admin/member/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    fetchJson<{ success: true; id: string }>(`/api/admin/member/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  bulkDelete: (data: { ids: string[] }) =>
    fetchJson<{ count: number }>('/api/admin/member/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
} as const
