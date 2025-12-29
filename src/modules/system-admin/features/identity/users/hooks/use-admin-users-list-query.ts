import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { userApi } from '../../../../shared/services/user-api'
import { type AdminUser } from '../data/schema'

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const

type PageData = {
  items: AdminUser[]
  total: number
  pageSize: number
  pageCount: number
}

type UseAdminUsersListQueryInput = {
  pageIndex: number
  pageSize: number
  filter?: string
  sorting: SortingState
  banned?: boolean
}

function buildUsersQueryKey(input: UseAdminUsersListQueryInput) {
  return [
    ...ADMIN_USERS_QUERY_KEY,
    {
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      filter: input.filter ?? '',
      sorting: input.sorting,
      banned: input.banned,
    },
  ]
}

function buildQueryParams(input: UseAdminUsersListQueryInput) {
  const firstSort = input.sorting[0]
  return {
    page: input.pageIndex + 1,
    pageSize: input.pageSize,
    filter: input.filter ? input.filter : undefined,
    banned: input.banned,
    sortBy: firstSort?.id,
    sortDir: firstSort?.id ? ((firstSort.desc ? 'desc' : 'asc') as 'asc' | 'desc') : undefined,
  }
}

export function useAdminUsersListQuery(input: UseAdminUsersListQueryInput) {
  const queryClient = useQueryClient()

  const { pageIndex, pageSize, filter, sorting, banned } = input

  const queryKey = useMemo(() => {
    return buildUsersQueryKey({ pageIndex, pageSize, filter, sorting, banned })
  }, [pageIndex, pageSize, filter, sorting, banned])

  const queryParams = useMemo(() => {
    return buildQueryParams({ pageIndex, pageSize, filter, sorting, banned })
  }, [pageIndex, pageSize, filter, sorting, banned])

  const {
    data: pageData,
    refetch,
    isRefetching,
  } = useQuery<PageData>({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      return await userApi.list({ ...queryParams, signal })
    },
  })

  useEffect(() => {
    if (!pageData) return

    const nextPageIndex = pageIndex + 1
    if (nextPageIndex >= pageData.pageCount) return

    const nextInput: UseAdminUsersListQueryInput = {
      pageIndex: nextPageIndex,
      pageSize,
      filter,
      sorting,
      banned,
    }

    const nextQueryKey = buildUsersQueryKey(nextInput)
    const nextQueryParams = buildQueryParams(nextInput)

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async ({ signal }) => {
        return await userApi.list({ ...nextQueryParams, signal })
      },
    })
  }, [pageData, queryClient, pageIndex, pageSize, filter, sorting, banned])

  return {
    pageData,
    data: pageData?.items ?? [],
    serverPageCount: pageData?.pageCount ?? 0,
    refetch,
    isRefetching,
  }
}






