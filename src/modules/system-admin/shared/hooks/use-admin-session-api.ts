import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionApi } from '../services/session-api'
import type { AdminSessionsPage } from '../types/session'

export type { AdminSessionInfo } from '../types/session'

export function useAdminSessions(params: {
  page: number
  pageSize: number
  filter?: string
  status?: Array<'active' | 'expired'>
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}) {
  return useQuery<AdminSessionsPage>({
    queryKey: ['admin', 'sessions', params],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      return await sessionApi.list({ ...params, signal })
    },
  })
}

export function useDeleteAdminSession() {
  const qc = useQueryClient()
  return useMutation<{ success: true; id: string }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      return await sessionApi.remove(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sessions'] })
    },
  })
}

export function useBulkDeleteAdminSessions() {
  const qc = useQueryClient()
  return useMutation<{ count: number }, Error, { ids: string[] }>({
    mutationFn: async ({ ids }) => {
      return await sessionApi.bulkDelete({ ids })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sessions'] })
    },
  })
}





