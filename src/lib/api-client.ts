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
import {
  adminUsersPageSchema,
  type AdminUsersPage,
} from '~/features/admin/users/data/schema'
import { tasksPageSchema, type TasksPage } from '~/features/demo/tasks/data/schema'
import { z } from 'zod'

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

export async function fetchJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
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

export async function fetchText(
  input: string,
  init?: RequestInit
): Promise<string> {
  const res = await fetch(input, init)
  if (res.ok) return await res.text()
  const body = (await readErrorBody(res)) ?? res.statusText
  throw new ApiError(body || 'Request failed', res.status)
}

export const apiClient = {
  navgroups: {
    list: () => fetchJson<AdminNavgroup[]>('/api/admin/navgroup/'),
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
    list: (navGroupId?: string) => {
      const url = navGroupId
        ? `/api/admin/navitem?navGroupId=${encodeURIComponent(navGroupId)}`
        : '/api/admin/navitem'
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
      const url = locale
        ? `/api/admin/translation/?locale=${encodeURIComponent(locale)}`
        : '/api/admin/translation/'
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
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      signal?: AbortSignal
    }): Promise<AdminUsersPage> => {
      const qs = new URLSearchParams()
      qs.set('page', String(params.page))
      qs.set('pageSize', String(params.pageSize))
      if (params.filter) qs.set('filter', params.filter)
      if (params.sortBy) qs.set('sortBy', params.sortBy)
      if (params.sortBy && params.sortDir) qs.set('sortDir', params.sortDir)

      const url = `/api/admin/user/?${qs.toString()}`
      return fetchJsonWithSchema(adminUsersPageSchema, url, {
        signal: params.signal,
      })
    },
    bulkBan: (input: {
      ids: string[]
      banned: boolean
      banReason?: string | null
      banExpires?: string | null
    }) =>
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
} as const
