import { fetchJson } from '@/shared/lib/fetch-utils'
import type {
  AdminNavgroup,
  CreateNavgroupData,
  UpdateNavgroupData,
  UserRoleNavGroup,
} from '../../features/navigation/navgroup'

export type UpdateNavgroupVisibilityData = {
  userId: string
  navGroupId: string
  isVisible: boolean
}

export type SuccessIdResponse = { success: true; id: string }

export const navgroupApi = {
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
} as const
