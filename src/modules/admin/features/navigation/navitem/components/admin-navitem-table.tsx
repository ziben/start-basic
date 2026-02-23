import { useMemo, useEffect, useState } from 'react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { AdminNavItem } from '../data/schema'
import { useAdminNavItemColumns } from './admin-navitem-columns'
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
      allVisibleItemsById: allVisibleItemsMap
    }
  }, [data, titleFilterValue, depthMap])

  // Effect for auto-expanding rows when filter is applied
  useEffect(() => {
    if (!titleFilterValue) {
      return
    }
    // const allItemsById = new Map(data.map(item => [item.id, item])); // Original data map
    const newExpanded: any = {}
    const lowercasedFilter = titleFilterValue.toLowerCase()

    // Iterate over all visible items (roots and children) to find matches and their ancestors for expansion
    allVisibleItemsById.forEach((item: any) => {
      if (item.title.toLowerCase().includes(lowercasedFilter)) {
        let currentAncestorId = item.parentId
        while (currentAncestorId) {
          if (allVisibleItemsById.has(currentAncestorId)) {
            // Ensure ancestor is in the visible set
            newExpanded[currentAncestorId] = true
          }
          const ancestorDetails: any = allVisibleItemsById.get(currentAncestorId) // Get details from visible set
          currentAncestorId = ancestorDetails ? ancestorDetails.parentId : null
        }
      }
    })
    setExpanded((prevExpanded) => {
      const baseExpanded = typeof prevExpanded === 'object' ? prevExpanded : {}
      return { ...baseExpanded, ...newExpanded }
    })
  }, [titleFilterValue, data, allVisibleItemsById])

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

  // 处理加载、错误和空数据状态
  if (isLoading) return <div className='py-8 text-center'>{t('common.loading')}</div>
  if (error)
    return (
      <div className='py-8 text-center text-red-500'>
        {t('admin.navitem.loadError', { message: error.message })}
      </div>
    )

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.navitem.search')}
        onReload={onReload}
        isReloading={isReloading}
        filters={[
          {
            columnId: 'title',
            title: t('admin.navitem.table.title'),
            options: [],
          },
        ]}
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





