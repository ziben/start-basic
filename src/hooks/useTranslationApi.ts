import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useTranslations(locale?: string) {
  return useQuery<any[]>({
    queryKey: ['admin', 'translations', locale || 'all'],
    queryFn: async () => {
      const url = locale ? `/api/admin/translation/?locale=${encodeURIComponent(locale)}` : '/api/admin/translation/'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch translations')
      return (await res.json()) as any[]
    },
  })
}

export function useCreateTranslation() {
  const qc = useQueryClient()
  return useMutation<any, Error, { locale: string; key: string; value: string }>({
    mutationFn: async (data) => {
      const res = await fetch('/api/admin/translation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Create failed')
      return await res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useUpdateTranslation() {
  const qc = useQueryClient()
  return useMutation<any, Error, { id: string; value: string }>({
    mutationFn: async ({ id, value }) => {
      const res = await fetch(`/api/admin/translation/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) throw new Error('Update failed')
      return await res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useDeleteTranslation() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/translation/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return await res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useImportTranslations() {
  const qc = useQueryClient()
  return useMutation<any, Error, any[]>({
    mutationFn: async (items) => {
      const res = await fetch('/api/admin/translation/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
      if (!res.ok) throw new Error('Import failed')
      return await res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useExportTranslations() {
  return async (locale?: string) => {
    const url = locale ? `/api/admin/translation/export?locale=${encodeURIComponent(locale)}` : '/api/admin/translation/export'
    const res = await fetch(url)
    if (!res.ok) throw new Error('Export failed')
    const text = await res.text()
    return text
  }
}
