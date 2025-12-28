import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'

export type AdminSystemLog = {
  id: string
  createdAt: string
  level: 'debug' | 'info' | 'warn' | 'error'
  requestId: string | null
  method: string
  path: string
  query: string | null
  status: number
  durationMs: number
  ip: string | null
  userAgent: string | null
  userId: string | null
  userRole: string | null
  error: string | null
  meta: unknown | null
}

export type AdminAuditLog = {
  id: string
  createdAt: string
  actorUserId: string | null
  actorRole: string | null
  action: string
  targetType: string
  targetId: string | null
  ip: string | null
  userAgent: string | null
  success: boolean
  message: string | null
  meta: unknown | null
}

export type AdminLogsPage = {
  type: 'system' | 'audit'
  items: AdminSystemLog[] | AdminAuditLog[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export function useAdminLogs(params: {
  type: 'system' | 'audit'
  page: number
  pageSize: number
  filter?: string
  level?: 'debug' | 'info' | 'warn' | 'error'
  success?: boolean
  action?: string
  actorUserId?: string
  targetType?: string
  targetId?: string
  from?: string
  to?: string
}) {
  return useQuery<AdminLogsPage>({
    queryKey: ['admin', 'logs', params],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      return await apiClient.adminLogs.list({ ...params, signal })
    },
  })
}




