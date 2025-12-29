import { fetchJsonWithSchema } from '@/shared/lib/fetch-utils'
import { adminUsersSchema, adminUsersPageSchema, type AdminUserPageData } from '../../features/identity/users'

export const userApi = {
  list: (params: {
    page: number
    pageSize: number
    filter?: string
    banned?: boolean
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    signal?: AbortSignal
  }): Promise<AdminUserPageData> => {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize))
    if (params.filter) qs.set('filter', params.filter)
    if (typeof params.banned === 'boolean') qs.set('banned', String(params.banned))
    if (params.sortBy) qs.set('sortBy', params.sortBy)
    if (params.sortBy && params.sortDir) qs.set('sortDir', params.sortDir)

    const url = `/api/admin/user/?${qs.toString()}`
    return fetchJsonWithSchema(adminUsersPageSchema, url, {
      signal: params.signal,
    })
  },
  create: (data: {
    email: string
    password: string
    name: string
    role?: 'admin' | 'user'
    username?: string
    banned?: boolean
  }) =>
    fetchJsonWithSchema(adminUsersSchema, '/api/admin/user/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: Partial<{
      name: string
      username: string | null
      role: string | null
      banned: boolean | null
      banReason: string | null
      banExpires: string | null
    }>
  ) =>
    fetchJsonWithSchema(adminUsersSchema, `/api/admin/user/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  bulkBan: (input: { ids: string[]; banned: boolean; banReason?: string | null; banExpires?: string | null }) =>
    fetchJsonWithSchema(
      { parse: (data: unknown) => data as { count: number } },
      '/api/admin/user/bulk-ban',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: input.ids,
          banned: input.banned,
          banReason: input.banReason ?? null,
          banExpires: input.banExpires ?? null,
        }),
      }
    ),
  bulkDelete: (input: { ids: string[] }) =>
    fetchJsonWithSchema(
      { parse: (data: unknown) => data as { count: number } },
      '/api/admin/user/bulk-delete',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    ),
} as const
