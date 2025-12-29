import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  getExpandedRowModel,
  ExpandedState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { AdminNavItem } from '../data/schema'
import { useAdminNavItemColumns } from './admin-navitem-columns'

interface Props {
  readonly data: ReadonlyArray<AdminNavItem>
  readonly isLoading?: boolean
  readonly error?: Error | null
  readonly navGroupId?: string
}

export default function AdminNavItemTable({ data, isLoading, error, navGroupId }: Props) {
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
    const rootNodesForTable = currentVisibleFlatTree.filter((item) => {
      if (!item.parentId) return true // Global root
      // Item is a root in the current view if its parent is not in currentVisibleFlatTree
      return !currentVisibleFlatTree.find((parentCandidate) => parentCandidate.id === item.parentId)
    })

    const allVisibleItemsMap = new Map(currentVisibleFlatTree.map((item) => [item.id, item]))

    const subRowsFunc = (row: AdminNavItem): AdminNavItem[] => {
      return currentVisibleFlatTree.filter((item) => item.parentId === row.id)
    }

    return { tableData: rootNodesForTable, getSubRowsFunction: subRowsFunc, allVisibleItemsById: allVisibleItemsMap }
  }, [data, titleFilterValue, depthMap])

  // Effect for auto-expanding rows when filter is applied
  useEffect(() => {
    if (!titleFilterValue) {
      return
    }
    // const allItemsById = new Map(data.map(item => [item.id, item])); // Original data map
    const newExpanded: ExpandedState = {}
    const lowercasedFilter = titleFilterValue.toLowerCase()

    // Iterate over all visible items (roots and children) to find matches and their ancestors for expansion
    allVisibleItemsById.forEach((item) => {
      if (item.title.toLowerCase().includes(lowercasedFilter)) {
        let currentAncestorId = item.parentId
        while (currentAncestorId) {
          if (allVisibleItemsById.has(currentAncestorId)) {
            // Ensure ancestor is in the visible set
            newExpanded[currentAncestorId] = true
          }
          const ancestorDetails = allVisibleItemsById.get(currentAncestorId) // Get details from visible set
          currentAncestorId = ancestorDetails ? ancestorDetails.parentId : null
        }
      }
    })
    setExpanded((prevExpanded) => {
      const baseExpanded = typeof prevExpanded === 'object' ? prevExpanded : {}
      return { ...baseExpanded, ...newExpanded }
    })
  }, [titleFilterValue, data, allVisibleItemsById, setExpanded])

  // 创建table实例
  const table = useReactTable({
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
    getSubRows: getSubRowsFunction,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const rows = table.getRowModel().rows
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  // 处理加载、错误和空数据状态
  if (isLoading) return <div className='py-8 text-center'>加载中...</div>
  if (error) return <div className='py-8 text-center text-red-500'>加载出错: {error.message}</div>

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end : 0

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.navgroup.table.searchPlaceholder')}
        filters={[
          {
            columnId: 'title',
            title: t('admin.navgroup.table.title'),
            options: [],
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <div ref={tableContainerRef} className='max-h-[70vh] overflow-auto'>
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
                <>
                  {paddingTop > 0 ? (
                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} className='p-0' style={{ height: `${paddingTop}px` }} />
                    </TableRow>
                  ) : null}

                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index]!
                    return (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group/row'>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cell.column.columnDef.meta?.className ?? ''}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}

                  {paddingBottom > 0 ? (
                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} className='p-0' style={{ height: `${paddingBottom}px` }} />
                    </TableRow>
                  ) : null}
                </>
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





