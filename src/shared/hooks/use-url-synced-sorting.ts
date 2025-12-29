import { useCallback, useMemo, useState } from 'react'
import { type OnChangeFn } from '@tanstack/react-table'
import { type SortingState } from '@tanstack/react-table'
import { type NavigateFn, useTableUrlState } from './use-table-url-state'

type SearchRecord = Record<string, unknown>

type UseUrlSyncedSortingParams = {
  search: SearchRecord
  navigate: NavigateFn
  pagination?: Parameters<typeof useTableUrlState>[0]['pagination']
  globalFilter?: Parameters<typeof useTableUrlState>[0]['globalFilter']
  columnFilters?: Parameters<typeof useTableUrlState>[0]['columnFilters']
  sorting?: {
    sortByKey?: string
    sortDirKey?: string
    normalizeSortBy?: (sortBy: string) => string
    resetPageOnSort?: boolean
  }
}

type UseUrlSyncedSortingReturn = ReturnType<typeof useTableUrlState> & {
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

export function useUrlSyncedSorting(params: UseUrlSyncedSortingParams): UseUrlSyncedSortingReturn {
  const {
    search,
    navigate,
    pagination,
    globalFilter,
    columnFilters,
    sorting: sortingCfg,
  } = params

  const sortByKey = sortingCfg?.sortByKey ?? 'sortBy'
  const sortDirKey = sortingCfg?.sortDirKey ?? 'sortDir'
  const normalizeSortBy = sortingCfg?.normalizeSortBy
  const resetPageOnSort = sortingCfg?.resetPageOnSort ?? true

  const pageKey = pagination?.pageKey ?? 'page'

  const tableUrl = useTableUrlState({
    search,
    navigate,
    pagination,
    globalFilter,
    columnFilters,
  })

  const initialSorting = useMemo<SortingState>(() => {
    const rawSortBy = search[sortByKey]
    const rawSortDir = search[sortDirKey]

    if (typeof rawSortBy !== 'string' || !rawSortBy) return []

    const sortBy = normalizeSortBy ? normalizeSortBy(rawSortBy) : rawSortBy
    const desc = rawSortDir === 'desc'

    return [{ id: sortBy, desc }]
  }, [normalizeSortBy, search, sortByKey, sortDirKey])

  const [sorting, setSorting] = useState<SortingState>(initialSorting)

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)

      const firstSort = next[0]
      const sortBy = firstSort?.id ? String(firstSort.id) : undefined
      const sortDir = firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined

      navigate({
        search: (prev) => ({
          ...(prev as SearchRecord),
          ...(resetPageOnSort ? { [pageKey]: undefined } : null),
          [sortByKey]: sortBy,
          [sortDirKey]: sortDir,
        }),
      })
    },
    [navigate, pageKey, resetPageOnSort, sortByKey, sortDirKey, sorting]
  )

  return {
    ...tableUrl,
    sorting,
    onSortingChange,
  }
}

