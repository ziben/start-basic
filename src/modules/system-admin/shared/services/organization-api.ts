import { z } from 'zod'
import { fetchJsonWithSchema, fetchJson } from '@/shared/lib/fetch-utils'
import type { AdminOrganizationInfo } from '../types/organization'

const makePageSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    pageCount: z.number(),
  })

const adminOrganizationInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string(),
  createdAt: z.string(),
  metadata: z.string(),
  memberCount: z.number(),
  invitationCount: z.number(),
}) satisfies z.ZodType<AdminOrganizationInfo>

const adminOrganizationsPageSchema = makePageSchema(adminOrganizationInfoSchema)

export const organizationApi = {
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: string
    signal?: AbortSignal
  }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.pageSize) search.set('pageSize', String(params.pageSize))
    if (params?.filter) search.set('filter', params.filter)
    if (params?.sortBy) search.set('sortBy', params.sortBy)
    if (params?.sortDir) search.set('sortDir', params.sortDir)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    return fetchJsonWithSchema(adminOrganizationsPageSchema, `/api/admin/organization/${suffix}`, {
      signal: params?.signal,
    })
  },
  get: (id: string) => fetchJson<AdminOrganizationInfo>(`/api/admin/organization/${encodeURIComponent(id)}`),
  create: (data: { name: string; slug?: string; logo?: string; metadata?: string }) =>
    fetchJson<AdminOrganizationInfo>('/api/admin/organization/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; slug?: string; logo?: string; metadata?: string }) =>
    fetchJson<AdminOrganizationInfo>(`/api/admin/organization/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    fetchJson<{ success: true; id: string }>(`/api/admin/organization/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  bulkDelete: (data: { ids: string[] }) =>
    fetchJson<{ count: number }>('/api/admin/organization/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
} as const
