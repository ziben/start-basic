import { z } from 'zod'
import type {
  AdminNavgroup,
  CreateNavgroupData,
  UpdateNavgroupData,
  UserRoleNavGroup,
} from '~/features/admin/navgroup/data/schema'
import type {
  AdminNavItem,
  AdminNavItemList,
  CreateNavItemData,
  UpdateNavItemData,
} from '~/features/admin/navitem/data/schema'
import { adminUsersSchema, adminUsersPageSchema, type AdminUsersPage } from '~/features/admin/users/data/schema'
import { tasksPageSchema, type TasksPage } from '~/features/demo/tasks/data/schema'
import type { AdminSessionInfo } from '~/hooks/use-admin-session-api'

export type AdminOrganizationInfo = {
  id: string
  name: string
  slug: string
  logo: string
  createdAt: string
  metadata: string
  memberCount: number
  invitationCount: number
}

export type AdminMemberInfo = {
  id: string
  userId: string
  username: string
  email: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: string
  createdAt: string
}

export type AdminInvitationInfo = {
  id: string
  email: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: string
  status: string
  createdAt: string
  expiresAt: string | null
}

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

export type Translation = {
  id: string
  locale: string
  key: string
  value: string
  createdAt: string | Date
}

export type TranslationImportResult = { inserted: number; updated: number }

export type UpdateNavgroupVisibilityData = {
  userId: string
  navGroupId: string
  isVisible: boolean
}

export type ToggleNavItemVisibilityData = {
  id: string
  isVisible: boolean
}

export type SuccessIdResponse = { success: true; id: string }
export type NavItemVisibilityResponse = {
  success: true
  id: string
  isVisible: boolean
}

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null
}

async function readErrorBody(res: Response): Promise<string | null> {
  try {
    const ct = res.headers.get('content-type')?.toLowerCase() ?? ''
    if (ct.includes('application/json')) {
      const data = (await res.json()) as unknown
      if (isRecord(data)) {
        const title = typeof data.title === 'string' ? data.title : undefined
        const message = typeof data.message === 'string' ? data.message : undefined
        return title ?? message ?? JSON.stringify(data)
      }
      return JSON.stringify(data)
    }
    return await res.text()
  } catch {
    return null
  }
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (res.ok) {
    return (await res.json()) as T
  }

  const body = (await readErrorBody(res)) ?? res.statusText
  throw new ApiError(body || 'Request failed', res.status)
}

export async function fetchJsonWithSchema<T>(
  schema: { parse: (data: unknown) => T },
  input: string,
  init?: RequestInit
): Promise<T> {
  const raw = await fetchJson<unknown>(input, init)
  return schema.parse(raw)
}

export async function fetchText(input: string, init?: RequestInit): Promise<string> {
  const res = await fetch(input, init)
  if (res.ok) return await res.text()
  const body = (await readErrorBody(res)) ?? res.statusText
  throw new ApiError(body || 'Request failed', res.status)
}

export const apiClient = {
  navgroups: {
    list: (scope?: 'APP' | 'ADMIN') => {
      const url = scope ? `/api/admin/navgroup/?scope=${encodeURIComponent(scope)}` : '/api/admin/navgroup/'
      return fetchJson<AdminNavgroup[]>(url)
    },
    get: (id: string) => fetchJson<AdminNavgroup>(`/api/admin/navgroup/${encodeURIComponent(id)}`),
    create: (data: CreateNavgroupData) =>
      fetchJson<AdminNavgroup>('/api/admin/navgroup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateNavgroupData) =>
      fetchJson<AdminNavgroup>(`/api/admin/navgroup/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchJson<SuccessIdResponse>(`/api/admin/navgroup/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    updateOrder: (groupIds: string[]) =>
      fetchJson<{ success: true }>('/api/admin/navgroup/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds }),
      }),
    updateVisibility: (data: UpdateNavgroupVisibilityData) =>
      fetchJson<UserRoleNavGroup>('/api/admin/navgroup/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  navitems: {
    list: (navGroupId?: string, scope?: 'APP' | 'ADMIN') => {
      const params = new URLSearchParams()
      if (navGroupId) params.set('navGroupId', navGroupId)
      if (scope) params.set('scope', scope)
      const query = params.toString()
      const url = query ? `/api/admin/navitem?${query}` : '/api/admin/navitem'
      return fetchJson<AdminNavItemList>(url)
    },
    get: (id: string) => fetchJson<AdminNavItem>(`/api/admin/navitem/${encodeURIComponent(id)}`),
    create: (data: CreateNavItemData) =>
      fetchJson<AdminNavItem>('/api/admin/navitem/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateNavItemData) =>
      fetchJson<AdminNavItem>(`/api/admin/navitem/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchJson<SuccessIdResponse>(`/api/admin/navitem/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    updateOrder: (itemIds: string[]) =>
      fetchJson<{ success: true }>('/api/admin/navitem/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      }),
    toggleVisibility: (data: ToggleNavItemVisibilityData) =>
      fetchJson<NavItemVisibilityResponse>('/api/admin/navitem/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  translations: {
    list: (locale?: string) => {
      const url = locale ? `/api/admin/translation/?locale=${encodeURIComponent(locale)}` : '/api/admin/translation/'
      return fetchJson<Translation[]>(url)
    },
    create: (data: Omit<Translation, 'id' | 'createdAt'>) =>
      fetchJson<Translation>('/api/admin/translation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Pick<Translation, 'value'>>) =>
      fetchJson<Translation>(`/api/admin/translation/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchJson<{ success: true }>(`/api/admin/translation/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    import: (items: Array<Pick<Translation, 'locale' | 'key' | 'value'>>) =>
      fetchJson<TranslationImportResult>('/api/admin/translation/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      }),
    exportCsv: (locale?: string) => {
      const url = locale
        ? `/api/admin/translation/export?locale=${encodeURIComponent(locale)}`
        : '/api/admin/translation/export'
      return fetchText(url)
    },
  },
  users: {
    list: (params: {
      page: number
      pageSize: number
      filter?: string
      banned?: boolean
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      signal?: AbortSignal
    }): Promise<AdminUsersPage> => {
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
      fetchJson<{ count: number }>('/api/admin/user/bulk-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: input.ids,
          banned: input.banned,
          banReason: input.banReason ?? null,
          banExpires: input.banExpires ?? null,
        }),
      }),
    bulkDelete: (input: { ids: string[] }) =>
      fetchJson<{ count: number }>('/api/admin/user/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
  },
  demoTasks: {
    list: (params: {
      page: number
      pageSize: number
      filter?: string
      status?: string[]
      priority?: string[]
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      signal?: AbortSignal
    }): Promise<TasksPage> => {
      const qs = new URLSearchParams()
      qs.set('page', String(params.page))
      qs.set('pageSize', String(params.pageSize))
      if (params.filter) qs.set('filter', params.filter)
      for (const s of params.status ?? []) qs.append('status', s)
      for (const p of params.priority ?? []) qs.append('priority', p)
      if (params.sortBy) qs.set('sortBy', params.sortBy)
      if (params.sortBy && params.sortDir) qs.set('sortDir', params.sortDir)

      const url = `/api/demo/tasks/?${qs.toString()}`
      return fetchJsonWithSchema(tasksPageSchema, url, { signal: params.signal })
    },
  },
  sessions: {
    list: () => {
      const sessionInfoSchema = z.object({
        id: z.string(),
        userId: z.string(),
        username: z.string(),
        email: z.string(),
        loginTime: z.string(),
        expiresAt: z.string(),
        ipAddress: z.string(),
        userAgent: z.string(),
        isActive: z.boolean(),
      })
      const sessionsSchema = z.array(sessionInfoSchema)
      return fetchJsonWithSchema(sessionsSchema, '/api/sessions')
    },
  },
  adminSessions: {
    list: (params?: {
      page?: number
      pageSize?: number
      filter?: string
      status?: Array<'active' | 'expired'>
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      /** legacy */
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
  },
  adminOrganizations: {
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
  },
  adminMembers: {
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
  },
  adminInvitations: {
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
  },
} as const
