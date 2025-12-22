import React from 'react'
import { ColumnDef, FilterFn, Row } from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useNavgroups } from '~/hooks/useNavgroupApi'
import { useTranslation } from '~/hooks/useTranslation'
import { iconResolver } from '~/utils/icon-resolver'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminNavItem } from '../data/schema'
import { DataTableRowActions } from './admin-navitem-row-actions'

interface UseAdminNavItemColumnsProps {
  navGroupId?: string
}

export function useAdminNavItemColumns({ navGroupId: currentNavGroupIdProp }: UseAdminNavItemColumnsProps = {}) {
  const { t } = useTranslation()
  const { data: navgroups } = useNavgroups()

  const navgroupMap = React.useMemo(() => {
    if (!navgroups) return new Map<string, string>()
    return new Map(navgroups.map((ng) => [ng.id, ng.title]))
  }, [navgroups])

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const arrIncludesSomeFilterFn: FilterFn<AdminNavItem> = (
    row: Row<AdminNavItem>,
    columnId: string,
    filterValue: any
  ): boolean => {
    if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
      return true
    }
    const rowValue = row.getValue<string>(columnId)
    if (typeof rowValue === 'string' && filterValue.every((item) => typeof item === 'string')) {
      return filterValue.includes(rowValue)
    }
    return false
  }

  const navGroupColumn: ColumnDef<AdminNavItem> = {
    accessorKey: 'navGroupId',
    header: () => t('admin.navitem.table.navgroup'),
    cell: ({ row }) => {
      const navGroupIdValue = row.getValue<string>('navGroupId')
      const navGroupName = navgroupMap.get(navGroupIdValue) ?? navGroupIdValue
      return (
        <div className='max-w-[120px] truncate' title={navGroupName}>
          {t(`${navGroupName}`, { defaultMessage: navGroupName })}
        </div>
      )
    },
    meta: { className: 'w-32' },
    filterFn: arrIncludesSomeFilterFn,
  }

  const columns: ColumnDef<AdminNavItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('common.selectAll', { defaultMessage: '全选' })}
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('common.selectRow', { defaultMessage: '选择行' })}
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { className: 'w-10 sticky left-0 z-10 bg-background' },
    },
    {
      accessorKey: 'id',
      header: () => t('admin.navitem.table.id'),
      cell: ({ row }) => (
        <div className='max-w-[120px] truncate' title={row.getValue('id')}>
          {row.getValue('id')}
        </div>
      ),
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'title',
      header: () => t('admin.navitem.table.title'),
      cell: ({ row }) => {
        const navItem = row.original as AdminNavItem
        const depth = navItem.depth ?? 0
        const canExpand = row.getCanExpand()
        const titleValue = t(row.getValue<string>('title'))

        return (
          <div className='flex items-center'>
            {depth > 0 && <div style={{ width: `${depth * 20}px` }} className='shrink-0' />}
            {canExpand && (
              <Button
                variant='ghost'
                size='icon'
                className='mr-1 h-6 w-6 p-0'
                onClick={() => row.toggleExpanded()}
                aria-label={
                  row.getIsExpanded()
                    ? t('common.collapse', { defaultMessage: '折叠' })
                    : t('common.expand', { defaultMessage: '展开' })
                }
              >
                {row.getIsExpanded() ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
              </Button>
            )}
            <span className='truncate' title={titleValue}>
              {titleValue}
            </span>
          </div>
        )
      },
      meta: { className: 'w-40' },
    },
    {
      accessorKey: 'url',
      header: () => t('admin.navitem.table.url'),
      cell: ({ row }) => {
        const urlValue = row.getValue<string | null>('url')
        return <div title={urlValue ?? ''}>{urlValue ?? '-'}</div>
      },
      meta: { className: 'w-40' },
    },
    ...(!currentNavGroupIdProp ? [navGroupColumn] : []),
    {
      accessorKey: 'icon',
      header: () => t('admin.navitem.table.icon'),
      cell: ({ row }) => {
        const navItem = row.original as AdminNavItem
        return (
          <div title={navItem.icon ?? ''} className='flex items-center'>
            {navItem.icon && (
              <span className='mr-2'>
                {(() => {
                  const IconComponent = iconResolver(navItem.icon)
                  return IconComponent ? <IconComponent className='h-4 w-4' /> : null
                })()}
              </span>
            )}
          </div>
        )
      },
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'badge',
      header: () => t('admin.navitem.table.badge'),
      cell: ({ row }) => {
        const badgeValue = row.getValue<string | null>('badge')
        const isVisible = !row.original.badge

        if (badgeValue === '隐藏' || (row.original as any).isVisible === false) {
          return (
            <Badge variant='outline' className='border-red-300 bg-red-50 text-red-700'>
              {t('admin.navitem.visibility.hidden')}
            </Badge>
          )
        }

        if (badgeValue) {
          return <Badge className='bg-primary text-primary-foreground'>{badgeValue}</Badge>
        }
        return (
          <Badge variant='outline' className='border-green-300 bg-green-50 text-green-700'>
            {t('admin.navitem.visibility.visible')}
          </Badge>
        )
      },
      meta: { className: 'w-20' },
    },
    {
      accessorKey: 'orderIndex',
      header: () => t('admin.navitem.table.orderIndex'),
      cell: ({ row }) => row.getValue('orderIndex'),
      meta: { className: 'w-20' },
    },
    {
      accessorKey: 'isCollapsible',
      header: () => t('admin.navitem.table.type'),
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className={cn('capitalize', {
            'border-blue-300 bg-blue-50 text-blue-700': row.getValue('isCollapsible'),
            'border-gray-300 bg-gray-50 text-gray-700': !row.getValue('isCollapsible'),
          })}
        >
          {row.getValue<boolean>('isCollapsible')
            ? t('admin.navitem.table.type.collapsible')
            : t('admin.navitem.table.type.link')}
        </Badge>
      ),
      meta: { className: 'w-20' },
    },
    {
      id: 'children_count',
      header: () => t('admin.navitem.table.children'),
      cell: ({ row }) => {
        const children = row.original.children ?? []
        return children.length > 0 ? `${children.length} ${t('admin.navitem.table.childrenCountSuffix')}` : '-'
      },
      meta: { className: 'w-20 text-center' },
    },
    {
      accessorKey: 'createdAt',
      header: () => t('admin.navitem.table.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
      meta: { className: 'w-32' },
    },
    {
      id: 'actions',
      header: () => t('common.actions', { defaultMessage: '操作' }),
      cell: ({ row }) => <DataTableRowActions row={row} />,
      meta: { className: 'w-20 text-right sticky right-0 z-10 bg-background' },
    },
  ]
  return { columns }
}
