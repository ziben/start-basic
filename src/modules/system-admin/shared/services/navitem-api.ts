import { fetchJson } from '@/shared/lib/fetch-utils'
import type {
  AdminNavItem,
  AdminNavItemList,
  CreateNavItemData,
  UpdateNavItemData,
} from '../../features/navigation/navitem'

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

export const navitemApi = {
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
} as const
