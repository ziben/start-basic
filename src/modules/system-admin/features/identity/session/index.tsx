import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { getRouteApi } from '@tanstack/react-router'
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminSessions,
  useBulkDeleteAdminSessions,
  useDeleteAdminSession,
  type AdminSessionInfo,
} from '~/modules/system-admin/shared/hooks/use-admin-session-api'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { useUrlSyncedSorting } from '@/shared/hooks/use-url-synced-sorting'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTableColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const route = getRouteApi('/admin/session')

export default function AdminSession() {
  const { t } = useTranslation()

  const search = route.useSearch()
  const navigate = route.useNavigate()

  const deleteOne = useDeleteAdminSession()
  const bulkDelete = useBulkDeleteAdminSessions()

  const [rowSelection, setRowSelection] = useState({})

  const tableUrl = useUrlSyncedSorting({
    search: search as any,
    navigate: navigate as unknown as NavigateFn,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [{ columnId: 'isActive', searchKey: 'status', type: 'array' }],
    sorting: {
      normalizeSortBy: (sortBy) => (sortBy === 'loginTime' ? 'createdAt' : sortBy),
      resetPageOnSort: true,
    },
  })

  const sorting = tableUrl.sorting

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    userId: false,
    device: false,
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'single' | 'bulk'>('single')
  const [pendingSingleId, setPendingSingleId] = useState<string | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewSession, setViewSession] = useState<AdminSessionInfo | null>(null)

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  }, [])

  const formatUserAgent = useCallback((userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('Macintosh')) return 'macOS'
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Linux')) return 'Linux'
    return 'Other'
  }, [])

  const isMutating = deleteOne.isPending || bulkDelete.isPending

  const openSingleDelete = useCallback((id: string) => {
    setConfirmMode('single')
    setPendingSingleId(id)
    setConfirmOpen(true)
  }, [])

  const openBulkDelete = useCallback(() => {
    setConfirmMode('bulk')
    setPendingSingleId(null)
    setConfirmOpen(true)
  }, [])

  const columns = useMemo(() => {
    const cols: ColumnDef<AdminSessionInfo>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'index',
        header: '#',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex
          const pageSize = table.getState().pagination.pageSize
          return <span className='text-muted-foreground'>{pageIndex * pageSize + row.index + 1}</span>
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
      },
      {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='UserId' />,
      },
      {
        id: 'user',
        accessorFn: (row) => `${row.username} ${row.email}`,
        header: t('admin.session.columns.user', { defaultMessage: '用户' }),
        cell: ({ row }) => {
          const s = row.original
          return (
            <div>
              <div className='font-medium'>{s.username || '-'}</div>
              <div className='text-sm text-muted-foreground'>{s.email || '-'}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: t('admin.session.columns.status', { defaultMessage: '状态' }),
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          return (
            <Badge variant={s.isActive ? 'default' : 'secondary'}>
              {s.isActive
                ? t('admin.session.status.active', { defaultMessage: '活跃' })
                : t('admin.session.status.expired', { defaultMessage: '已过期' })}
            </Badge>
          )
        },
      },
      {
        id: 'createdAt',
        accessorFn: (row) => row.loginTime,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('admin.session.columns.loginTime', { defaultMessage: '登录时间' })}
          />
        ),
        cell: ({ row }) => <span className='text-sm'>{formatDate(row.original.loginTime)}</span>,
      },
      {
        accessorKey: 'expiresAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('admin.session.columns.expiresAt', { defaultMessage: '过期时间' })}
          />
        ),
        cell: ({ row }) => <span className='text-sm'>{formatDate(row.original.expiresAt)}</span>,
      },
      {
        accessorKey: 'ipAddress',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('admin.session.columns.ip', { defaultMessage: 'IP' })} />
        ),
        cell: ({ row }) => <span className='text-sm'>{row.original.ipAddress || '-'}</span>,
      },
      {
        id: 'device',
        accessorFn: (row) => row.userAgent,
        header: t('admin.session.columns.device', { defaultMessage: '设备' }),
        cell: ({ row }) => <span className='text-sm'>{formatUserAgent(row.original.userAgent || '')}</span>,
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>{t('common.actions', { defaultMessage: '操作' })}</div>,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  setViewSession(s)
                  setViewOpen(true)
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
              >
                {t('common.view', { defaultMessage: '查看' })}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation()
                  openSingleDelete(s.id)
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
              >
                {t('admin.session.revoke', { defaultMessage: '撤销' })}
              </Button>
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ]

    return cols
  }, [formatDate, formatUserAgent, isMutating, openSingleDelete, t])

  const statusFilter = tableUrl.columnFilters.find((f) => f.id === 'isActive')
  const status = Array.isArray(statusFilter?.value)
    ? (statusFilter!.value.map((v) => String(v)) as Array<'active' | 'expired'>)
    : undefined

  const firstSort = sorting[0]
  const sortBy = firstSort?.id
  const sortDir = firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined

  const {
    data: pageData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useAdminSessions({
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    filter: tableUrl.globalFilter ? tableUrl.globalFilter : undefined,
    status,
    sortBy,
    sortDir,
  })

  const sessions = pageData?.items ?? []
  const serverPageCount = pageData?.pageCount ?? 0

  const table = useReactTable({
    data: sessions,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: tableUrl.columnFilters,
      globalFilter: tableUrl.globalFilter,
      pagination: tableUrl.pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: tableUrl.onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: tableUrl.onPaginationChange,
    onGlobalFilterChange: tableUrl.onGlobalFilterChange,
    onColumnFiltersChange: tableUrl.onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    tableUrl.ensurePageInRange(serverPageCount)
  }, [serverPageCount, tableUrl])

  const handleConfirm = async () => {
    try {
      if (confirmMode === 'single') {
        if (!pendingSingleId) return
        await deleteOne.mutateAsync({ id: pendingSingleId })
        toast.success(t('admin.session.toast.deleteSuccess', { defaultMessage: '会话已撤销' }))
      } else {
        const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)
        if (ids.length === 0) return
        const res = await bulkDelete.mutateAsync({ ids })
        toast.success(
          t('admin.session.toast.bulkDeleteSuccess', {
            defaultMessage: `已撤销 ${res.count} 个会话`,
          })
        )
        setRowSelection({})
      }
      setConfirmOpen(false)
    } catch (e) {
      toast.error(t('admin.session.toast.deleteError', { defaultMessage: '操作失败' }), { description: String(e) })
    }
  }
  const selectedCount = table.getSelectedRowModel().rows.length

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
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('admin.session.title', { defaultMessage: '会话管理' })}
            </h2>
            <p className='text-muted-foreground'>{t('admin.session.desc', { defaultMessage: '查看与撤销活跃会话' })}</p>
          </div>

          <div className='flex items-center gap-2'>
            <Button onClick={() => refetch()} disabled={isRefetching} variant='outline' size='sm'>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              {t('common.refresh', { defaultMessage: '刷新' })}
            </Button>

            <Button
              variant='destructive'
              size='sm'
              disabled={selectedCount === 0 || isMutating}
              onClick={openBulkDelete}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              {t('admin.session.bulkRevoke', { defaultMessage: '批量撤销' })}
              {selectedCount > 0 ? (
                <span className='ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs'>{selectedCount}</span>
              ) : null}
            </Button>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <div className='flex h-full flex-col space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
            {error ? <div className='py-8 text-center text-red-500'>{String(error)}</div> : null}

            {!error ? (
              <>
                <DataTableToolbar
                  table={table}
                  searchPlaceholder={t('admin.session.searchPlaceholder', { defaultMessage: '搜索用户/邮箱/IP/UA...' })}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={setColumnVisibility}
                  filters={[
                    {
                      columnId: 'isActive',
                      title: t('admin.session.columns.status', { defaultMessage: '状态' }),
                      options: [
                        { label: t('admin.session.status.active', { defaultMessage: '活跃' }), value: 'active' },
                        { label: t('admin.session.status.expired', { defaultMessage: '已过期' }), value: 'expired' },
                      ],
                    },
                  ]}
                />

                <div className='min-h-0 flex-1 overflow-hidden rounded-md border'>
                  <div className='h-full overflow-auto'>
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} colSpan={header.colSpan}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>

                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='h-24 text-center'>
                              {t('common.loading', { defaultMessage: '加载中...' })}
                            </TableCell>
                          </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='h-24 text-center'>
                              {t('admin.common.noData', { defaultMessage: '暂无数据' })}
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

      <ConfirmDialog
        destructive
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingSingleId(null)
        }}
        title={
          confirmMode === 'single'
            ? t('admin.session.confirm.single.title', { defaultMessage: '撤销会话' })
            : t('admin.session.confirm.bulk.title', { defaultMessage: '批量撤销会话' })
        }
        desc={
          confirmMode === 'single'
            ? t('admin.session.confirm.single.desc', { defaultMessage: '确定要撤销该会话吗？' })
            : t('admin.session.confirm.bulk.desc', { defaultMessage: '确定要撤销选中的会话吗？' })
        }
        confirmText={t('common.delete', { defaultMessage: '确认' })}
        cancelBtnText={t('common.buttons.cancel', { defaultMessage: '取消' })}
        handleConfirm={handleConfirm}
        isLoading={isMutating}
        disabled={confirmMode === 'single' ? !pendingSingleId : selectedCount === 0}
      />

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewSession(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.session.view.title', { defaultMessage: '会话详情' })}</DialogTitle>
            <DialogDescription>
              {t('admin.session.view.desc', { defaultMessage: '查看该会话的详细信息' })}
            </DialogDescription>
          </DialogHeader>

          {viewSession ? (
            <div className='space-y-2 text-sm'>
              <div>
                <span className='text-muted-foreground'>ID：</span>
                <span className='font-mono'>{viewSession.id}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>UserId：</span>
                <span className='font-mono'>{viewSession.userId}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>用户名：</span>
                <span>{viewSession.username || '-'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>邮箱：</span>
                <span>{viewSession.email || '-'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>状态：</span>
                <span>{viewSession.isActive ? 'active' : 'expired'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>登录时间：</span>
                <span>{formatDate(viewSession.loginTime)}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>过期时间：</span>
                <span>{formatDate(viewSession.expiresAt)}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>IP：</span>
                <span>{viewSession.ipAddress || '-'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>UA：</span>
                <span className='break-words'>{viewSession.userAgent || '-'}</span>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>{t('common.buttons.close', { defaultMessage: '关闭' })}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}







