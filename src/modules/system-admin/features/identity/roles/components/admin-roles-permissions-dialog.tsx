/**
 * 角色权限分配对话框
 * 用于为角色分配权限和设置数据范围
 */

import { useState, useEffect } from 'react'
import { useAllPermissions } from '~/modules/system-admin/shared/hooks/use-permission-api'
import { useRolePermissions, useAssignRolePermissions } from '~/modules/system-admin/shared/hooks/use-role-permission-api'
import { DataScopeSelector } from '~/modules/system-admin/shared/components/data-scope-selector'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

// 定义权限类型
interface Permission {
    id: string
    name: string
    resource: string
    action: string
    label: string
    description?: string | null
}

// 定义角色权限类型
interface RolePermission {
    id: string
    permissionId: string
    dataScope: string | null
    permission: Permission
}

interface RolePermissionsDialogProps {
    roleId: string | null
    roleName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RolePermissionsDialog({
    roleId,
    roleName,
    open,
    onOpenChange,
}: RolePermissionsDialogProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<
        Record<string, { permissionId: string; dataScope: string }>
    >({})

    const { data: allPermissions, isLoading: loadingPermissions } = useAllPermissions()
    const { data: rolePermissions, isLoading: loadingRolePerms } = useRolePermissions(roleId || '')
    const assignMutation = useAssignRolePermissions()

    // 初始化已选权限
    useEffect(() => {
        if (rolePermissions && open) {
            const initial: Record<string, { permissionId: string; dataScope: string }> = {}
            rolePermissions.forEach((rp: RolePermission) => {
                initial[rp.permissionId] = {
                    permissionId: rp.permissionId,
                    dataScope: rp.dataScope || 'SELF'
                }
            })
            setSelectedPermissions(initial)
        }
    }, [rolePermissions, open])

    // 按资源分组权限
    const groupedPermissions = (allPermissions || []).reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        if (!acc[perm.resource]) {
            acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    // 类型转换辅助函数
    const getGroupedEntries = () => {
        return Object.entries(groupedPermissions) as [string, Permission[]][]
    }

    const handleTogglePermission = (permissionId: string) => {
        setSelectedPermissions(prev => {
            const newState = { ...prev }
            if (newState[permissionId]) {
                delete newState[permissionId]
            } else {
                newState[permissionId] = {
                    permissionId,
                    dataScope: 'SELF'
                }
            }
            return newState
        })
    }

    const handleDataScopeChange = (permissionId: string, dataScope: string) => {
        setSelectedPermissions(prev => ({
            ...prev,
            [permissionId]: {
                permissionId,
                dataScope
            }
        }))
    }

    const handleSave = () => {
        if (!roleId) return

        const permissions = Object.values(selectedPermissions)

        assignMutation.mutate(
            {
                roleId,
                permissions
            },
            {
                onSuccess: () => {
                    onOpenChange(false)
                }
            }
        )
    }

    const isLoading = loadingPermissions || loadingRolePerms

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-3xl max-h-[80vh]'>
                <DialogHeader>
                    <DialogTitle>分配权限 - {roleName}</DialogTitle>
                    <DialogDescription>
                        为角色选择权限并设置数据访问范围
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin' />
                    </div>
                ) : (
                    <ScrollArea className='h-[500px] pr-4'>
                        <div className='space-y-6'>
                            {getGroupedEntries().map(([resource, permissions]) => (
                                <div key={resource} className='space-y-3'>
                                    <div className='flex items-center gap-2'>
                                        <Badge variant='outline' className='text-sm font-semibold'>
                                            {resource}
                                        </Badge>
                                        <span className='text-xs text-muted-foreground'>
                                            {permissions.length} 个权限
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className='space-y-3'>
                                        {permissions.map((perm: Permission) => {
                                            const isSelected = !!selectedPermissions[perm.id]
                                            return (
                                                <div
                                                    key={perm.id}
                                                    className='flex items-center justify-between gap-4 rounded-lg border p-3'
                                                >
                                                    <div className='flex items-center gap-3 flex-1'>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleTogglePermission(perm.id)}
                                                        />
                                                        <div className='flex-1'>
                                                            <div className='font-medium'>{perm.label}</div>
                                                            <div className='text-xs text-muted-foreground'>
                                                                {perm.name}
                                                                {perm.description && ` - ${perm.description}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className='w-[200px]'>
                                                            <DataScopeSelector
                                                                value={selectedPermissions[perm.id].dataScope}
                                                                onValueChange={(scope) => handleDataScopeChange(perm.id, scope)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={assignMutation.isPending || isLoading}
                    >
                        {assignMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
