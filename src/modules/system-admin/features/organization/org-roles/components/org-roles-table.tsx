/**
 * 组织角色表格
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2, Shield, Lock } from 'lucide-react'
import { useOrgRolesContext } from './org-roles-provider'

interface OrgRole {
    id: string
    role: string
    permission: Record<string, string[]>
    organizationId: string
    createdAt?: string
}

// 内置角色（不可编辑/删除）
const BUILTIN_ROLES = ['owner', 'admin', 'member']

interface OrgRolesTableProps {
    roles: OrgRole[]
    isLoading: boolean
    organizationId: string
}

export function OrgRolesTable({ roles, isLoading, organizationId }: OrgRolesTableProps) {
    const { openEdit, openDelete } = useOrgRolesContext()

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        )
    }

    // 合并内置角色和动态角色显示
    const allRoles = [
        // 内置角色
        { id: 'owner', role: 'owner', permission: {}, isBuiltin: true, label: '所有者' },
        { id: 'admin', role: 'admin', permission: {}, isBuiltin: true, label: '管理员' },
        { id: 'member', role: 'member', permission: {}, isBuiltin: true, label: '成员' },
        // 动态角色
        ...roles.map(r => ({ ...r, isBuiltin: false, label: r.role }))
    ]

    const formatPermissions = (permission: Record<string, string[]>) => {
        const entries = Object.entries(permission)
        if (entries.length === 0) return <span className="text-muted-foreground">-</span>

        return (
            <div className="flex flex-wrap gap-1">
                {entries.slice(0, 3).map(([resource, actions]) => (
                    <Badge key={resource} variant="secondary" className="text-xs">
                        {resource}: {actions.join(', ')}
                    </Badge>
                ))}
                {entries.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                        +{entries.length - 3} 更多
                    </Badge>
                )}
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">角色名称</TableHead>
                    <TableHead>权限</TableHead>
                    <TableHead className="w-[100px]">类型</TableHead>
                    <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allRoles.map((role) => (
                    <TableRow key={role.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                {role.isBuiltin ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Shield className="h-4 w-4 text-primary" />
                                )}
                                {role.label || role.role}
                            </div>
                        </TableCell>
                        <TableCell>
                            {role.isBuiltin ? (
                                <span className="text-muted-foreground text-sm">系统预设权限</span>
                            ) : (
                                formatPermissions(role.permission)
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={role.isBuiltin ? 'secondary' : 'default'}>
                                {role.isBuiltin ? '内置' : '自定义'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {!role.isBuiltin && (
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(role as OrgRole)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDelete(role as OrgRole)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {allRoles.length === 3 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            暂无自定义角色，点击上方按钮创建
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
