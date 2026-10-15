import { useMemo, useState } from 'react'
import { QueryState } from '@/shared/components/query-state'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { AdminNavItem } from '~/modules/navigation/shared/navitem/data/schema'
import { dataTableFeatures, tableFeatures } from '~/shared/lib/tanstack-table'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  useTable,
  flexRender,
  createExpandedRowModel,
  ExpandedState,
} from '~/shared/lib/tanstack-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useAdminNavItemColumns } from './admin-navitem-columns'

const features = tableFeatures({
  ...dataTableFeatures,
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  expandedRowModel: createExpandedRowModel(),
})

interface Props {
  readonly data: ReadonlyArray<AdminNavItem>
  readonly isLoading?: boolean
  readonly error?: Error | null
  readonly navGroupId?: string
  readonly onReload?: () => void
  readonly isReloading?: boolean
}

export default function AdminNavItemTable({ data, isLoading, error, navGroupId, onReload, isReloading }: Props) {
  const { t } = useTranslation()
  // 获取列配置
  const { columns } = useAdminNavItemColumns({ navGroupId })
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    updatedAt: false,
    description: false,
    target: false,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'navGroupId',
      desc: false,
    },
    {
      id: 'orderIndex',
      desc: false,
    },
  ])

  // Helper to get filter value for 'title' column
  const titleFilterValue = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === 'title')
    return filter ? (filter.value as string) : undefined
  }, [columnFilters])

  // Pre-calculate depths for all items once, based on original data
  const depthMap = useMemo(() => {
    const map = new Map<string, number>()
    const calculateDepthsRecursive = (itemId: string, currentDepth: number) => {
      map.set(itemId, currentDepth)
      data
        .filter((i) => i.parentId === itemId)
        .forEach((child) => {
          calculateDepthsRecursive(child.id, currentDepth + 1)
        })
    }
    // Start recursion for root items (parentId is null)
    data
      .filter((i) => i.parentId === null)
      .forEach((rootItem) => {
        calculateDepthsRecursive(rootItem.id, 0)
      })
    return map
  }, [data])

  // Process data for table display (filtering and tree structure)
  const { tableData, getSubRowsFunction, allVisibleItemsById } = useMemo(() => {
    const buildTreeRecursive = (currentParentId: string | null): AdminNavItem[] => {
      let treeNodes: AdminNavItem[] = []
      data
        .filter((item) => item.parentId === currentParentId) // Get direct children
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .forEach((childItem) => {
          const depth = depthMap.get(childItem.id)
          // Add the child item itself
          treeNodes.push({ ...childItem, depth: depth ?? 0 })
          // Recursively add its descendants
          treeNodes = treeNodes.concat(buildTreeRecursive(childItem.id))
        })
      return treeNodes
    }

    const fullFlatTree = buildTreeRecursive(null) // Build full tree starting from root

    let currentVisibleFlatTree = fullFlatTree
    if (titleFilterValue) {
      const lowercasedFilter = titleFilterValue.toLowerCase()
      const allItemsInFullTreeById = new Map(fullFlatTree.map((item) => [item.id, item]))
      const visibleItemIds = new Set<string>()

      fullFlatTree.forEach((item) => {
        if (item.title.toLowerCase().includes(lowercasedFilter)) {
          visibleItemIds.add(item.id)
          let currentAncestorId = item.parentId
          while (currentAncestorId) {
            visibleItemIds.add(currentAncestorId)
            const ancestor = allItemsInFullTreeById.get(currentAncestorId)
            currentAncestorId = ancestor ? ancestor.parentId : null
          }
          const addDescendants = (parentId: string) => {
            fullFlatTree.forEach((childInTree) => {
              if (childInTree.parentId === parentId) {
                visibleItemIds.add(childInTree.id)
                addDescendants(childInTree.id)
              }
            })
          }
          addDescendants(item.id)
        }
      })
      currentVisibleFlatTree = fullFlatTree.filter((item) => visibleItemIds.has(item.id))
    }

    // For react-table, data should be root nodes of the current view
    const treeData = currentVisibleFlatTree.filter((item) => {
      // 如果没有父级，它就是根节点
      if (!item.parentId) return true
      // 如果有父级，但父级不在当前可见列表中，它也作为根节点显示
      return !currentVisibleFlatTree.find((parentCandidate) => parentCandidate.id === item.parentId)
    })

    const allVisibleItemsMap = new Map(currentVisibleFlatTree.map((item) => [item.id, item]))

    const subRowsFunc = (row: AdminNavItem): AdminNavItem[] => {
      // 返回当前节点在可见列表中的直接子节点
      return currentVisibleFlatTree.filter((item) => item.parentId === row.id)
    }

    return {
      tableData: treeData,
      getSubRowsFunction: subRowsFunc,
      allVisibleItemsById: allVisibleItemsMap,
    }
  }, [data, titleFilterValue, depthMap])

  const [previousVisibleItems, setPreviousVisibleItems] = useState(allVisibleItemsById)
  // Update only when the search or data changes so users can still collapse rows.
  if (previousVisibleItems !== allVisibleItemsById) {
    setPreviousVisibleItems(allVisibleItemsById)
    if (titleFilterValue) {
      const newExpanded: Record<string, boolean> = {}
      const lowercasedFilter = titleFilterValue.toLowerCase()
      allVisibleItemsById.forEach((item) => {
        if (item.title.toLowerCase().includes(lowercasedFilter)) {
          let currentAncestorId = item.parentId
          while (currentAncestorId) {
            newExpanded[currentAncestorId] = true
            currentAncestorId = allVisibleItemsById.get(currentAncestorId)?.parentId
          }
        }
      })
      setExpanded((prevExpanded) => {
        const baseExpanded = typeof prevExpanded === 'object' ? prevExpanded : {}
        return { ...baseExpanded, ...newExpanded }
      })
    }
  }

  // 创建table实例
  const table = useTable({
    features,
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      expanded,
    },
    enableRowSelection: true,
    enableExpanding: true,
    autoResetExpanded: false,
    getRowId: (row) => row.id,
    getSubRows: getSubRowsFunction,
    filterFromLeafRows: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
  })

  const rows = table.getRowModel().rows

  // 处理加载、错误和空数据状态
  if (isLoading || error)
    return <QueryState isLoading={isLoading} error={error} onRetry={() => onReload?.()} isRetrying={isReloading} />

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.navitem.search')}
        searchKey='title'
        onReload={onReload}
        isReloading={isReloading}
      />
      <div className='min-h-0 flex-1 overflow-auto rounded-md border'>
        <div>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='group/row'>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={header.column.columnDef.meta?.className ?? ''}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows?.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group/row'>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.className ?? ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    {t('admin.navitem.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
