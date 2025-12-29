import { z } from 'zod'
import { fetchJsonWithSchema, fetchJson } from '@/shared/lib/fetch-utils'
import type { AdminInvitationInfo } from '../types/invitation'

const makePageSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    pageCount: z.number(),
  })

const adminInvitationInfoSchema = z.object({
  id: z.string(),
  email: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  role: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
}) satisfies z.ZodType<AdminInvitationInfo>

const adminInvitationsPageSchema = makePageSchema(adminInvitationInfoSchema)

export const invitationApi = {
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    status?: string
    sortBy?: string
    sortDir?: string
    signal?: AbortSignal
  }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.pageSize) search.set('pageSize', String(params.pageSize))
    if (params?.filter) search.set('filter', params.filter)
    if (params?.organizationId) search.set('organizationId', params.organizationId)
    if (params?.status) search.set('status', params.status)
    if (params?.sortBy) search.set('sortBy', params.sortBy)
    if (params?.sortDir) search.set('sortDir', params.sortDir)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    return fetchJsonWithSchema(adminInvitationsPageSchema, `/api/admin/invitation/${suffix}`, {
      signal: params?.signal,
    })
  },
  get: (id: string) => fetchJson<AdminInvitationInfo>(`/api/admin/invitation/${encodeURIComponent(id)}`),
  create: (data: { organizationId: string; email: string; role: string; expiresAt?: string }) =>
    fetchJson<AdminInvitationInfo>('/api/admin/invitation/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { email?: string; role?: string; status?: string; expiresAt?: string }) =>
    fetchJson<AdminInvitationInfo>(`/api/admin/invitation/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    fetchJson<{ success: true; id: string }>(`/api/admin/invitation/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  bulkDelete: (data: { ids: string[] }) =>
    fetchJson<{ count: number }>('/api/admin/invitation/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
} as const
