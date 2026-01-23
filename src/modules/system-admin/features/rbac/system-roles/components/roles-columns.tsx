import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Shield, Users } from 'lucide-react'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { useRolesContext } from '../context/roles-context'
import type { Role } from '@/generated/prisma/client'

type RoleWithCount = Role & {
  rolePermissions: Array<{ permission: any }>
}

export function useRolesColumns() {
  const { t } = useTranslation()
  const { openEditDialog, openDeleteDialog, openPermissionsDialog } = useRolesContext()

  const columns: ColumnDef<RoleWithCount>[] = [
    {
      accessorKey: 'displayName',
      header: t('admin.role.columns.name'),
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{role.displayName}</div>
              <div className="text-xs text-muted-foreground">{role.name}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'scope',
      header: t('admin.role.columns.scope'),
      cell: ({ row }) => {
        const scope = row.getValue('scope') as string
        const scopeMap = {
          GLOBAL: { label: t('admin.role.scope.global'), variant: 'default' as const },
          ORGANIZATION: { label: t('admin.role.scope.organization'), variant: 'secondary' as const },
          CUSTOM: { label: t('admin.role.scope.custom'), variant: 'outline' as const },
        }
        const config = scopeMap[scope as keyof typeof scopeMap]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'category',
      header: t('admin.role.columns.category'),
      cell: ({ row }) => {
        const category = row.getValue('category') as string | null
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">{t('admin.common.empty')}</span>
        )
      },
    },
    {
      id: 'permissions',
      header: t('admin.role.columns.permissions'),
      cell: ({ row }) => {
        const count = row.original.rolePermissions?.length || 0
        return (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{count}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'isTemplate',
      header: t('admin.role.columns.template'),
      cell: ({ row }) => {
        const isTemplate = row.getValue('isTemplate') as boolean
        return isTemplate ? <Badge variant="secondary">{t('admin.role.badge.template')}</Badge> : null
      },
    },
    {
      accessorKey: 'isSystem',
      header: t('admin.role.columns.system'),
      cell: ({ row }) => {
        const isSystem = row.getValue('isSystem') as boolean
        return isSystem ? <Badge variant="destructive">{t('admin.role.badge.system')}</Badge> : null
      },
    },
    {
      accessorKey: 'isActive',
      header: t('admin.role.columns.status'),
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? t('admin.role.status.active') : t('admin.role.status.inactive')}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const role = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('admin.common.openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('admin.common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openPermissionsDialog(role)}>
                {t('admin.role.actions.permissions')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(role)} disabled={role.isSystem}>
                {t('admin.common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(role)}
                disabled={role.isSystem}
                className="text-destructive"
              >
                {t('admin.common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return columns
}
