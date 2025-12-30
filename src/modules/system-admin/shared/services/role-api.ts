import { fetchJsonWithSchema } from '@/shared/lib/fetch-utils'
import {
  systemRoleSchema,
  systemRolePageSchema,
  type SystemRole,
  type SystemRolePageData,
  type CreateRoleData,
  type UpdateRoleData,
} from '../../features/identity/roles/data/schema'

export const roleApi = {
  list: (params: {
    page: number
    pageSize: number
    filter?: string
    signal?: AbortSignal
  }): Promise<SystemRolePageData> => {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    if (params.filter) qs.set('filter', params.filter)

    const url = `/api/admin/role/?${qs.toString()}`
    return fetchJsonWithSchema(systemRolePageSchema, url, {
      signal: params.signal,
    })
  },
  get: (id: string): Promise<SystemRole> =>
    fetchJsonWithSchema(systemRoleSchema, `/api/admin/role/${encodeURIComponent(id)}`),
  create: (data: CreateRoleData): Promise<SystemRole> =>
    fetchJsonWithSchema(systemRoleSchema, '/api/admin/role/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateRoleData): Promise<SystemRole> =>
    fetchJsonWithSchema(systemRoleSchema, `/api/admin/role/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  remove: (id: string): Promise<{ success: true; id: string }> =>
    fetchJsonWithSchema(
      { parse: (data: unknown) => data as { success: true; id: string } },
      `/api/admin/role/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    ),
  // 维护角色与导航组的关系
  assignNavGroups: (id: string, navGroupIds: string[]): Promise<{ success: true }> =>
    fetchJsonWithSchema(
      { parse: (data: unknown) => data as { success: true } },
      `/api/admin/role/${encodeURIComponent(id)}/nav-groups`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navGroupIds }),
      }
    ),
} as const
