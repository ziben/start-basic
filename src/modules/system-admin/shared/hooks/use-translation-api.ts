import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { translationApi } from '../services/translation-api'
import type { Translation, TranslationImportResult } from '../types/translation'

export function useTranslations(locale?: string) {
  return useQuery<Translation[]>({
    queryKey: ['admin', 'translations', locale || 'all'],
    queryFn: () => translationApi.list(locale),
  })
}

export function useCreateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { locale: string; key: string; value: string }>({
    mutationFn: (data: Omit<Translation, 'id' | 'createdAt'>) => translationApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useUpdateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { id: string; data: Partial<Pick<Translation, 'value'>> }>({
    mutationFn: ({ id, data }) => translationApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useDeleteTranslation() {
  const qc = useQueryClient()
  return useMutation<{ success: true }, Error, string>({
    mutationFn: (id: string) => translationApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useImportTranslations() {
  const qc = useQueryClient()
  return useMutation<TranslationImportResult, Error, Array<Pick<Translation, 'locale' | 'key' | 'value'>>>({
    mutationFn: (items) => translationApi.import(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'translations'] }),
  })
}

export function useExportTranslations() {
  return async (locale?: string) => {
    return await translationApi.exportCsv(locale)
  }
}





