import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, type Translation, type TranslationImportResult } from '~/lib/api-client'

export function useTranslations(locale?: string) {
  return useQuery<Translation[]>({
    queryKey: ['admin', 'translations', locale || 'all'],
    queryFn: async () => {
      return await apiClient.translations.list(locale)
    },
  })
}

export function useCreateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { locale: string; key: string; value: string }>({
    mutationFn: async (data) => await apiClient.translations.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useUpdateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { id: string; value: string }>({
    mutationFn: async ({ id, value }) => await apiClient.translations.update(id, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useDeleteTranslation() {
  const qc = useQueryClient()
  return useMutation<{ success: true }, Error, string>({
    mutationFn: async (id) => await apiClient.translations.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useImportTranslations() {
  const qc = useQueryClient()
  return useMutation<TranslationImportResult, Error, Array<Pick<Translation, 'locale' | 'key' | 'value'>>>({
    mutationFn: async (items) => await apiClient.translations.import(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useExportTranslations() {
  return async (locale?: string) => {
    return await apiClient.translations.exportCsv(locale)
  }
}
