import { fetchJson, fetchText } from '@/shared/lib/fetch-utils'
import type { Translation, TranslationImportResult } from '../types/translation'

export const translationApi = {
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
} as const
