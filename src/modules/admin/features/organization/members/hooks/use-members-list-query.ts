import { useEffect } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'
import { memberQueryKeys } from '~/shared/lib/query-keys'
import { getMembersFn } from '../../../../shared/server-fns/member.fn'
import { type Member } from '../data/schema'

type UseMembersListQueryProps = {
  pageIndex: number
  pageSize: number
  filter?: string
  organizationId?: string
  sorting: SortingState
}

export function useMembersListQuery({ pageIndex, pageSize, filter, organizationId, sorting }: UseMembersListQueryProps) {
  const queryClient = useQueryClient()

  const sortBy = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? 'desc' : 'asc'

  const queryKey = memberQueryKeys.list({
    page: pageIndex + 1,
    pageSize,
    filter,
    organizationId,
    sortBy,
    sortDir,
  })

  const { data: pageData, ...rest } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getMembersFn({
        data: {
          page: pageIndex + 1,
          pageSize,
          filter,
          organizationId,
          sortBy,
          sortDir,
        },
      })
      return result
    },
    placeholderData: keepPreviousData,
  })

  const data: Member[] = pageData?.items ?? []
  const serverPageCount = pageData ? Math.ceil(pageData.total / pageSize) : 0

  useEffect(() => {
    if (!pageData) return
    const nextPageIndex = pageIndex + 1
    if (nextPageIndex >= pageData.pageCount) return

    const nextQueryKey = memberQueryKeys.list({
      page: nextPageIndex + 1,
      pageSize,
      filter,
      organizationId,
      sortBy,
      sortDir,
    })

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async () => {
        return await getMembersFn({
          data: {
            page: nextPageIndex + 1,
            pageSize,
            filter,
            organizationId,
            sortBy,
            sortDir,
          },
        })
      },
    })
  }, [pageData, queryClient, pageIndex, pageSize, filter, organizationId, sortBy, sortDir])

  return {
    data,
    serverPageCount,
    ...rest,
  }
}
