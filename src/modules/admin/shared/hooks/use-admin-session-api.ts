/**
 * Session API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSessionsFn, deleteSessionFn, bulkDeleteSessionsFn } from '../server-fns/session.fn'
import type { AdminSessionsPage } from '../types/session'
import { sessionQueryKeys } from '~/shared/lib/query-keys'

export type { AdminSessionInfo } from '../types/session'

// ============ Query Hooks ============

export function useAdminSessions(params: {
  page: number
  pageSize: number
  filter?: string
  status?: Array<'active' | 'expired'>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}) {
  return useQuery<AdminSessionsPage>({
    queryKey: sessionQueryKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await getSessionsFn({ data: params })
      return result as AdminSessionsPage
    },
  })
}

// ============ Mutation Hooks ============

export function useDeleteAdminSession() {
  const qc = useQueryClient()
  return useMutation<{ success: true; id: string }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      return await deleteSessionFn({ data: { id } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionQueryKeys.all })
    },
  })
}

export function useBulkDeleteAdminSessions() {
  const qc = useQueryClient()
  return useMutation<{ success: true; count: number }, Error, { ids: string[] }>({
    mutationFn: async ({ ids }) => {
      return await bulkDeleteSessionsFn({ data: { ids } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionQueryKeys.all })
    },
  })
}
