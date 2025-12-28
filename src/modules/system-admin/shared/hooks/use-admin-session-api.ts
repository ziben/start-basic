import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'

export type AdminSessionInfo = {
  id: string
  userId: string
  username: string
  email: string
  loginTime: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export type AdminSessionsPage = {
  items: AdminSessionInfo[]
  total: number
  pageCount: number
}

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
      return await apiClient.adminSessions.list({ ...params, signal })
    },
  })
}

export function useDeleteAdminSession() {
  const qc = useQueryClient()
  return useMutation<{ success: true; id: string }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      return await apiClient.adminSessions.remove(id)
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
      return await apiClient.adminSessions.bulkDelete({ ids })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sessions'] })
    },
  })
}




