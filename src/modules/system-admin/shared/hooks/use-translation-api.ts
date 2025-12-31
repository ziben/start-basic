/**
 * Translation API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTranslationsFn,
  createTranslationFn,
  updateTranslationFn,
  deleteTranslationFn,
  importTranslationsFn,
  exportTranslationsFn,
} from '../server-fns/translation.fn'
import type { Translation, TranslationImportResult } from '../types/translation'

// ============ Query Keys ============

export const translationQueryKeys = {
  all: ['admin', 'translations'] as const,
  list: (locale?: string) => [...translationQueryKeys.all, locale || 'all'] as const,
}

// ============ Query Hooks ============

export function useTranslations(locale?: string) {
  return useQuery<Translation[]>({
    queryKey: translationQueryKeys.list(locale),
    queryFn: async () => {
      const result = await getTranslationsFn({ data: { locale } })
      return result as Translation[]
    },
  })
}

// ============ Mutation Hooks ============

export function useCreateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { locale: string; key: string; value: string }>({
    mutationFn: async (data) => {
      const result = await createTranslationFn({ data })
      return result as Translation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: translationQueryKeys.all }),
  })
}

export function useUpdateTranslation() {
  const qc = useQueryClient()
  return useMutation<Translation, Error, { id: string; data: Partial<Pick<Translation, 'value'>> }>({
    mutationFn: async ({ id, data }) => {
      const result = await updateTranslationFn({ data: { id, ...data } })
      return result as Translation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: translationQueryKeys.all }),
  })
}

export function useDeleteTranslation() {
  const qc = useQueryClient()
  return useMutation<{ success: true }, Error, string>({
    mutationFn: async (id: string) => {
      const result = await deleteTranslationFn({ data: { id } })
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: translationQueryKeys.all }),
  })
}

export function useImportTranslations() {
  const qc = useQueryClient()
  return useMutation<TranslationImportResult, Error, Array<Pick<Translation, 'locale' | 'key' | 'value'>>>({
    mutationFn: (items) => importTranslationsFn({ data: items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: translationQueryKeys.all }),
  })
}

export function useExportTranslations() {
  return async (locale?: string) => {
    // 对于文件下载，我们需要处理 Response
    const response = await exportTranslationsFn({ data: { locale } })
    if (response instanceof Response) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translations-${locale || 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }
}
