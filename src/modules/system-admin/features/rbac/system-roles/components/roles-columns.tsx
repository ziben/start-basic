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
import { useRolesContext } from '../context/roles-context'
import type { Role } from '@/generated/prisma/client'

type RoleWithCount = Role & {
  rolePermissions: Array<{ permission: any }>
}

export function useRolesColumns() {
  const { openEditDialog, openDeleteDialog, openPermissionsDialog } = useRolesContext()

  const columns: ColumnDef<RoleWithCount>[] = [
    {
      accessorKey: 'displayName',
      header: '角色名称',
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
      header: '作用域',
      cell: ({ row }) => {
        const scope = row.getValue('scope') as string
        const scopeMap = {
          GLOBAL: { label: '全局', variant: 'default' as const },
          ORGANIZATION: { label: '组织', variant: 'secondary' as const },
          CUSTOM: { label: '自定义', variant: 'outline' as const },
        }
        const config = scopeMap[scope as keyof typeof scopeMap]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => {
        const category = row.getValue('category') as string | null
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      id: 'permissions',
      header: '权限数',
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
      header: '模板',
      cell: ({ row }) => {
        const isTemplate = row.getValue('isTemplate') as boolean
        return isTemplate ? <Badge variant="secondary">模板</Badge> : null
      },
    },
    {
      accessorKey: 'isSystem',
      header: '系统',
      cell: ({ row }) => {
        const isSystem = row.getValue('isSystem') as boolean
        return isSystem ? <Badge variant="destructive">系统</Badge> : null
      },
    },
    {
      accessorKey: 'isActive',
      header: '状态',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? '启用' : '禁用'}
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
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openPermissionsDialog(role)}>
                管理权限
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(role)} disabled={role.isSystem}>
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(role)}
                disabled={role.isSystem}
                className="text-destructive"
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return columns
}
