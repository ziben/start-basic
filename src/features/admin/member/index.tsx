import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { getRouteApi } from '@tanstack/react-router'
import { Building2, Edit, Trash2, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '~/hooks/useTranslation'
import {
  useAdminMembers,
  useDeleteAdminMember,
  useBulkDeleteAdminMembers,
  type AdminMemberInfo,
} from '~/hooks/use-admin-member-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'

const route = getRouteApi('/admin/member')

export default function AdminMember() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const deleteOne = useDeleteAdminMember()
  const bulkDelete = useBulkDeleteAdminMembers()

  const initialSorting = useMemo<SortingState>(() => {
    const sortBy = (search as Record<string, unknown>).sortBy
    const sortDir = (search as Record<string, unknown>).sortDir
    if (typeof sortBy !== 'string' || !sortBy) return []
    return [{ id: sortBy, desc: sortDir === 'desc' }]
  }, [search])

  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    userId: false,
    organizationId: false,
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'single' | 'bulk'>('single')
  const [pendingSingleId, setPendingSingleId] = useState<string | null>(null)

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  }, [])

  const isMutating = deleteOne.isPending || bulkDelete.isPending

  const openSingleDelete = useCallback((id: string) => {
    setConfirmMode('single')
    setPendingSingleId(id)
    setConfirmOpen(true)
  }, [])


  const columns = useMemo(() => {
    const cols: ColumnDef<AdminMemberInfo>[] = [
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
        accessorKey: 'username',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('admin.member.columns.username', { defaultMessage: '用户名' })} />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10'>
              <Users className='h-3 w-3' />
            </div>
            <div>
              <div className='font-medium'>{row.original.username}</div>
              <div className='text-sm text-muted-foreground'>{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('admin.member.columns.organization', { defaultMessage: '组织' })} />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Building2 className='h-4 w-4' />
            <div>
              <div className='font-medium'>{row.original.organizationName}</div>
              <div className='text-sm text-muted-foreground font-mono'>{row.original.organizationSlug}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('admin.member.columns.role', { defaultMessage: '角色' })} />
        ),
        cell: ({ row }) => {
          const role = row.original.role
          let color = 'default'
          if (role === 'admin' || role === 'owner') color = 'destructive'
          else if (role === 'manager') color = 'secondary'
          
          return (
            <Badge variant={color as any} className='capitalize'>
              {t(`admin.member.roles.${role}`, { defaultMessage: role })}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('admin.member.columns.createdAt', { defaultMessage: '加入时间' })}
          />
        ),
        cell: ({ row }) => <span className='text-sm'>{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>{t('common.actions', { defaultMessage: '操作' })}</div>,
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: '/admin/member/$id', params: { id: member.id } })
                }}
              >
                <Edit className='mr-2 h-4 w-4' />
                {t('common.edit', { defaultMessage: '编辑' })}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation()
                  openSingleDelete(member.id)
                }}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {t('common.remove', { defaultMessage: '移除' })}
              </Button>
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ]

    return cols
  }, [formatDate, isMutating, navigate, openSingleDelete, t])

  const tableUrl = useTableUrlState({
    search: search as any,
    navigate: route.useNavigate() as unknown as NavigateFn,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const firstSort = sorting[0]
  const sortBy = firstSort?.id
  const sortDir = firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined

  const { data: pageData, isLoading, error } = useAdminMembers({
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    filter: tableUrl.globalFilter ? tableUrl.globalFilter : undefined,
    sortBy,
    sortDir,
  })

  const members = (pageData as any)?.items ?? []
  const serverPageCount = (pageData as any)?.pageCount ?? 0

  const table = useReactTable({
    data: members,
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
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)

      const s = next[0]
      ;(navigate as any)({
        search: (prev: any) => ({
          ...prev,
          page: undefined,
          sortBy: s?.id ? s.id : undefined,
          sortDir: s?.id ? (s.desc ? 'desc' : 'asc') : undefined,
        }),
      })
    },
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
        await deleteOne.mutateAsync(pendingSingleId)
        toast.success(t('admin.member.toast.removeSuccess', { defaultMessage: '成员已移除' }))
      } else {
        const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)
        if (ids.length === 0) return
        const res = await bulkDelete.mutateAsync({ ids })
        toast.success(
          t('admin.member.toast.bulkRemoveSuccess', {
            defaultMessage: `已移除 ${res.count} 个成员`,
          })
        )
        setRowSelection({})
      }
      setConfirmOpen(false)
    } catch (e) {
      toast.error(t('admin.member.toast.removeError', { defaultMessage: '操作失败' }), { description: String(e) })
    }
  }

  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          <span>{t('admin.member.title', { defaultMessage: '成员管理' })}</span>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Button onClick={() => navigate({ to: '/admin/member/create' })} variant='default' size='sm'>
            <UserPlus className='mr-2 h-4 w-4' />
            {t('admin.member.create', { defaultMessage: '添加成员' })}
          </Button>
        </div>
      </Header>

      <Main fixed>
        <div className='-mx-4 flex-1 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <div className='flex h-full flex-col space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
            {error ? <div className='py-8 text-center text-red-500'>{String(error)}</div> : null}

            {!error ? (
              <>
                <DataTableToolbar
                  table={table}
                  searchPlaceholder={t('admin.member.searchPlaceholder', { defaultMessage: '搜索用户名/邮箱/组织...' })}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={setColumnVisibility}
                />

                <div className='min-h-0 flex-1 overflow-hidden rounded-md border'>
                  <div className='h-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                      <thead className='[&_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                          {table.getHeaderGroups().map((headerGroup) =>
                            headerGroup.headers.map((header) => (
                              <th key={header.id} className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody className='[&_tr:last-child]:border-0'>
                        {isLoading ? (
                          <tr>
                            <td colSpan={columns.length} className='h-24 text-center'>
                              {t('common.loading', { defaultMessage: '加载中...' })}
                            </td>
                          </tr>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                              {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className='p-4 align-middle [&:has([role=checkbox])]:pr-0'>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={columns.length} className='h-24 text-center'>
                              {t('admin.common.noData', { defaultMessage: '暂无数据' })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
            ? t('admin.member.confirm.single.title', { defaultMessage: '移除成员' })
            : t('admin.member.confirm.bulk.title', { defaultMessage: '批量移除成员' })
        }
        desc={
          confirmMode === 'single'
            ? t('admin.member.confirm.single.desc', { defaultMessage: '确定要移除该成员吗？此操作不可恢复。' })
            : t('admin.member.confirm.bulk.desc', { defaultMessage: '确定要移除选中的成员吗？此操作不可恢复。' })
        }
        confirmText={t('common.remove', { defaultMessage: '确认' })}
        cancelBtnText={t('common.buttons.cancel', { defaultMessage: '取消' })}
        handleConfirm={handleConfirm}
        isLoading={isMutating}
        disabled={confirmMode === 'single' ? !pendingSingleId : selectedCount === 0}
      />
    </>
  )
}
