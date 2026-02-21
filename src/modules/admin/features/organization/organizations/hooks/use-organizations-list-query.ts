import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import { getOrganizationsFn } from '../../../../shared/server-fns/organization.fn'
import { type Organization } from '../data/schema'

type PageData = {
  items: Organization[]
  total: number
  pageSize: number
  pageCount: number
}

type UseOrganizationsListQueryInput = {
  pageIndex: number
  pageSize: number
  filter?: string
  sorting: SortingState
}

function buildQueryKey(input: UseOrganizationsListQueryInput) {
  const firstSort = input.sorting[0]
  return organizationQueryKeys.list({
    page: input.pageIndex + 1,
    pageSize: input.pageSize,
    filter: input.filter ?? undefined,
    sortBy: firstSort?.id,
    sortDir: firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined,
  })
}

function buildQueryParams(input: UseOrganizationsListQueryInput) {
  const firstSort = input.sorting[0]
  return {
    page: input.pageIndex + 1,
    pageSize: input.pageSize,
    filter: input.filter ? input.filter : undefined,
    sortBy: firstSort?.id,
    sortDir: firstSort?.id ? ((firstSort.desc ? 'desc' : 'asc') as 'asc' | 'desc') : undefined,
  }
}

export function useOrganizationsListQuery(input: UseOrganizationsListQueryInput) {
  const queryClient = useQueryClient()

  const { pageIndex, pageSize, filter, sorting } = input

  const queryKey = useMemo(() => {
    return buildQueryKey({ pageIndex, pageSize, filter, sorting })
  }, [pageIndex, pageSize, filter, sorting])

  const queryParams = useMemo(() => {
    return buildQueryParams({ pageIndex, pageSize, filter, sorting })
  }, [pageIndex, pageSize, filter, sorting])

  const {
    data: pageData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PageData>({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await getOrganizationsFn({ data: queryParams })
      return result as PageData
    },
  })

  // 预加载下一页
  useEffect(() => {
    if (!pageData) return

    const nextPageIndex = pageIndex + 1
    if (nextPageIndex >= pageData.pageCount) return

    const nextInput: UseOrganizationsListQueryInput = {
      pageIndex: nextPageIndex,
      pageSize,
      filter,
      sorting,
    }

    const nextQueryKey = buildQueryKey(nextInput)
    const nextQueryParams = buildQueryParams(nextInput)

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async () => {
        const result = await getOrganizationsFn({ data: nextQueryParams })
        return result as PageData
      },
    })
  }, [pageData, queryClient, pageIndex, pageSize, filter, sorting])

  return {
    pageData,
    data: pageData?.items ?? [],
    serverPageCount: pageData?.pageCount ?? 0,
    isLoading,
    refetch,
    isRefetching,
  }
}
