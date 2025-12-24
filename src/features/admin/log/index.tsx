import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useAdminLogs, type AdminAuditLog, type AdminSystemLog } from '~/hooks/use-admin-log-api'
import { useTranslation } from '~/hooks/useTranslation'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const route = getRouteApi('/admin/log' as any)

type RouteSearch = {
  type?: 'system' | 'audit'
  page?: number
  pageSize?: number
  filter?: string
  level?: string[]
  success?: string[]
}

function toBooleanFilter(values: unknown): boolean | undefined {
  if (!Array.isArray(values)) return undefined
  const arr = values.map((v) => String(v)).filter(Boolean)
  if (arr.length !== 1) return undefined
  if (arr[0] === 'true') return true
  if (arr[0] === 'false') return false
  return undefined
}

function toStringOne(values: unknown): string | undefined {
  if (!Array.isArray(values)) return undefined
  const arr = values.map((v) => String(v)).filter(Boolean)
  if (arr.length !== 1) return undefined
  return arr[0]
}

export default function AdminLog() {
  const { t } = useTranslation()
  const search = route.useSearch() as unknown as RouteSearch
  const navigate = route.useNavigate()

  const type: 'system' | 'audit' = search.type === 'audit' ? 'audit' : 'system'

  const [sorting] = useState<SortingState>([])
  const [columnVisibility] = useState<VisibilityState>({})

  const tableUrl = useTableUrlState({
    search,
    navigate: navigate as unknown as NavigateFn,
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      {
        columnId: 'level',
        searchKey: 'level',
        type: 'array',
      },
      {
        columnId: 'success',
        searchKey: 'success',
        type: 'array',
      },
    ],
  })

  const level = toStringOne(tableUrl.columnFilters.find((f) => f.id === 'level')?.value) as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | undefined

  const success = toBooleanFilter(tableUrl.columnFilters.find((f) => f.id === 'success')?.value)

  const { data: pageData, isLoading, error } = useAdminLogs({
    type,
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    filter: tableUrl.globalFilter ? tableUrl.globalFilter : undefined,
    level: type === 'system' ? level : undefined,
    success: type === 'audit' ? success : undefined,
  })

  const items = (pageData?.items ?? []) as Array<AdminSystemLog | AdminAuditLog>
  const serverPageCount = pageData?.pageCount ?? 0

  const systemColumns = useMemo<ColumnDef<AdminSystemLog>[]>(() => {
    return [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => <span className='text-sm'>{new Date(row.original.createdAt).toLocaleString()}</span>,
      },
      {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title='级别' />,
        cell: ({ row }) => {
          const v = row.original.level
          return (
            <Badge variant={v === 'error' ? 'destructive' : v === 'warn' ? 'secondary' : 'outline'}>{v}</Badge>
          )
        },
      },
      {
        id: 'req',
        accessorFn: (row) => `${row.method} ${row.path}`,
        header: '请求',
        cell: ({ row }) => (
          <div>
            <div className='font-mono text-xs text-muted-foreground'>{row.original.requestId || '-'}</div>
            <div className='font-medium'>
              {row.original.method} {row.original.path}
            </div>
            <div className='text-sm text-muted-foreground'>{row.original.query || ''}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.status}</span>,
      },
      {
        accessorKey: 'durationMs',
        header: ({ column }) => <DataTableColumnHeader column={column} title='耗时(ms)' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.durationMs}</span>,
      },
      {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='用户' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.userId || '-'}</span>,
      },
      {
        accessorKey: 'error',
        header: '错误',
        cell: ({ row }) => <span className='text-sm text-red-600'>{row.original.error || ''}</span>,
      },
    ]
  }, [])

  const auditColumns = useMemo<ColumnDef<AdminAuditLog>[]>(() => {
    return [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => <span className='text-sm'>{new Date(row.original.createdAt).toLocaleString()}</span>,
      },
      {
        accessorKey: 'success',
        header: ({ column }) => <DataTableColumnHeader column={column} title='结果' />,
        cell: ({ row }) => (
          <Badge variant={row.original.success ? 'outline' : 'destructive'}>{row.original.success ? '成功' : '失败'}</Badge>
        ),
      },
      {
        accessorKey: 'action',
        header: ({ column }) => <DataTableColumnHeader column={column} title='动作' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.action}</span>,
      },
      {
        id: 'target',
        accessorFn: (row) => `${row.targetType}:${row.targetId ?? ''}`,
        header: '目标',
        cell: ({ row }) => <span className='font-mono text-xs'>{`${row.original.targetType}:${row.original.targetId ?? '-'}`}</span>,
      },
      {
        accessorKey: 'actorUserId',
        header: '操作者',
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.actorUserId || '-'}</span>,
      },
      {
        accessorKey: 'message',
        header: '信息',
        cell: ({ row }) => <span className='text-sm'>{row.original.message || ''}</span>,
      },
    ]
  }, [])

  const columns = (type === 'system' ? systemColumns : auditColumns) as ColumnDef<any>[]

  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters: tableUrl.columnFilters,
      globalFilter: tableUrl.globalFilter,
      pagination: tableUrl.pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onPaginationChange: tableUrl.onPaginationChange,
    onGlobalFilterChange: tableUrl.onGlobalFilterChange,
    onColumnFiltersChange: tableUrl.onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    tableUrl.ensurePageInRange(serverPageCount)
  }, [serverPageCount, tableUrl])

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>日志</h2>
            <p className='text-muted-foreground'>系统日志与操作日志</p>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex rounded-md border'>
              <button
                className={`px-3 py-1 text-sm ${type === 'system' ? 'bg-muted' : ''}`}
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, type: 'system', page: undefined }) } as never)}
              >
                系统
              </button>
              <button
                className={`px-3 py-1 text-sm ${type === 'audit' ? 'bg-muted' : ''}`}
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, type: 'audit', page: undefined }) } as never)}
              >
                操作
              </button>
            </div>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <div className='flex h-full flex-col space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
            {error ? <div className='py-8 text-center text-red-500'>{String(error)}</div> : null}

            {!error ? (
              <>
                <DataTableToolbar
                  table={table}
                  searchPlaceholder={t('common.search', { defaultMessage: '搜索...' })}
                  filters={
                    type === 'system'
                      ? [
                          {
                            columnId: 'level',
                            title: '级别',
                            options: [
                              { label: 'debug', value: 'debug' },
                              { label: 'info', value: 'info' },
                              { label: 'warn', value: 'warn' },
                              { label: 'error', value: 'error' },
                            ],
                          },
                        ]
                      : [
                          {
                            columnId: 'success',
                            title: '结果',
                            options: [
                              { label: '成功', value: 'true' },
                              { label: '失败', value: 'false' },
                            ],
                          },
                        ]
                  }
                />

                <div className='min-h-0 flex-1 overflow-hidden rounded-md border'>
                  <div className='h-full overflow-auto'>
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} colSpan={header.colSpan}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='h-24 text-center'>
                              加载中...
                            </TableCell>
                          </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='h-24 text-center'>
                              暂无数据
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <DataTablePagination table={table} />
              </>
            ) : null}
          </div>
        </div>
      </Main>
    </>
  )
}
