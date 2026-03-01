import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { getUsersFn } from '../server-fns/user.fn'
import { type AdminUser } from '../data/schema'

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
  const firstSort = input.sorting[0]
  return adminUsersQueryKeys.list({
    page: input.pageIndex + 1,
    pageSize: input.pageSize,
    filter: input.filter ?? undefined,
    sortBy: firstSort?.id,
    sortDir: firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined,
    banned: input.banned,
  })
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
    queryFn: async () => {
      const result = await getUsersFn({ data: queryParams })
      return result as PageData
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
      queryFn: async () => {
        const result = await getUsersFn({ data: nextQueryParams })
        return result as PageData
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






