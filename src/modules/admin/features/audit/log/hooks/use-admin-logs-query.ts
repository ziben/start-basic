import { useMemo } from 'react'
import { type SortingState } from '@tanstack/react-table'
import { useAdminLogs } from '~/modules/admin/shared/hooks/use-admin-log-api'

type UseAdminLogsQueryProps = {
  type: 'system' | 'audit'
  pageIndex: number
  pageSize: number
  filter?: string
  sorting: SortingState
  level?: 'debug' | 'info' | 'warn' | 'error'
  success?: boolean
}

export function useAdminLogsQuery({
  type,
  pageIndex,
  pageSize,
  filter,
  level,
  success,
}: UseAdminLogsQueryProps) {
  const { data: pageData, isLoading, error, refetch, isRefetching } = useAdminLogs({
    type,
    page: pageIndex + 1,
    pageSize,
    filter,
    level: type === 'system' ? level : undefined,
    success: type === 'audit' ? success : undefined,
  })

  const data = useMemo(() => pageData?.items ?? [], [pageData?.items])
  const serverPageCount = pageData?.pageCount ?? 0

  return {
    data,
    serverPageCount,
    isLoading,
    error,
    refetch,
    isRefetching,
  }
}




