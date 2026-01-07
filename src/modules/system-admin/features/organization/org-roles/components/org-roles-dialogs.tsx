/**
 * 组织角色对话框集合
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useOrgRolesContext } from './org-roles-provider'
import {
    useCreateOrgRole,
    useUpdateOrgRole,
    useDeleteOrgRole
} from '~/modules/system-admin/shared/hooks/use-org-role-api'
import { statement } from '~/modules/identity/shared/lib/auth'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface OrgRolesDialogsProps {
    organizationId: string
}

// 获取 statement 中定义的所有资源和操作
const AVAILABLE_PERMISSIONS = Object.entries(statement).map(([resource, actions]) => ({
    resource,
    actions: actions as readonly string[]
}))

export function OrgRolesDialogs({ organizationId }: OrgRolesDialogsProps) {
    return (
        <>
            <CreateRoleDialog organizationId={organizationId} />
            <EditRoleDialog organizationId={organizationId} />
            <DeleteRoleDialog organizationId={organizationId} />
        </>
    )
}

// 创建角色对话框
function CreateRoleDialog({ organizationId }: { organizationId: string }) {
    const { isCreateOpen, closeCreate } = useOrgRolesContext()
    const createMutation = useCreateOrgRole()

    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState<Record<string, string[]>>({})

    const handleSubmit = async () => {
        await createMutation.mutateAsync({
            role: roleName,
            permission: permissions,
            organizationId
        })
        handleClose()
    }

    const handleClose = () => {
        setRoleName('')
        setPermissions({})
        closeCreate()
    }

    const togglePermission = (resource: string, action: string) => {
        setPermissions(prev => {
            const current = prev[resource] || []
            const hasAction = current.includes(action)

            if (hasAction) {
                const newActions = current.filter(a => a !== action)
                if (newActions.length === 0) {
                    const { [resource]: _, ...rest } = prev
                    return rest
                }
                return { ...prev, [resource]: newActions }
            } else {
                return { ...prev, [resource]: [...current, action] }
            }
        })
    }

    return (
        <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>创建角色</DialogTitle>
                    <DialogDescription>
                        为组织创建新的自定义角色并分配权限
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="roleName">角色名称 *</Label>
                        <Input
                            id="roleName"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="例如: editor, viewer, moderator"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>权限配置</Label>
                        <div className="border rounded-lg p-4 space-y-4">
                            {AVAILABLE_PERMISSIONS.map(({ resource, actions }) => (
                                <div key={resource} className="space-y-2">
                                    <div className="font-medium text-sm capitalize">
                                        {resource}
                                    </div>
                                    <div className="flex flex-wrap gap-4 pl-4">
                                        {actions.map((action) => (
                                            <div key={action} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${resource}-${action}`}
                                                    checked={(permissions[resource] || []).includes(action)}
                                                    onCheckedChange={() => togglePermission(resource, action)}
                                                />
                                                <label
                                                    htmlFor={`${resource}-${action}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {action}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!roleName || createMutation.isPending}
                    >
                        {createMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        创建
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// 编辑角色对话框
function EditRoleDialog({ organizationId }: { organizationId: string }) {
    const { isEditOpen, closeEdit, selectedRole } = useOrgRolesContext()
    const updateMutation = useUpdateOrgRole()

    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState<Record<string, string[]>>({})

    useEffect(() => {
        if (selectedRole) {
            setRoleName(selectedRole.role)
            setPermissions(selectedRole.permission || {})
        }
    }, [selectedRole])

    const handleSubmit = async () => {
        if (!selectedRole) return

        await updateMutation.mutateAsync({
            roleId: selectedRole.id,
            organizationId,
            data: {
                roleName,
                permission: permissions
            }
        })
        handleClose()
    }

    const handleClose = () => {
        setRoleName('')
        setPermissions({})
        closeEdit()
    }

    const togglePermission = (resource: string, action: string) => {
        setPermissions(prev => {
            const current = prev[resource] || []
            const hasAction = current.includes(action)

            if (hasAction) {
                const newActions = current.filter(a => a !== action)
                if (newActions.length === 0) {
                    const { [resource]: _, ...rest } = prev
                    return rest
                }
                return { ...prev, [resource]: newActions }
            } else {
                return { ...prev, [resource]: [...current, action] }
            }
        })
    }

    return (
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>编辑角色</DialogTitle>
                    <DialogDescription>
                        修改角色名称和权限配置
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="editRoleName">角色名称 *</Label>
                        <Input
                            id="editRoleName"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="角色名称"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>权限配置</Label>
                        <div className="border rounded-lg p-4 space-y-4">
                            {AVAILABLE_PERMISSIONS.map(({ resource, actions }) => (
                                <div key={resource} className="space-y-2">
                                    <div className="font-medium text-sm capitalize">
                                        {resource}
                                    </div>
                                    <div className="flex flex-wrap gap-4 pl-4">
                                        {actions.map((action) => (
                                            <div key={action} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-${resource}-${action}`}
                                                    checked={(permissions[resource] || []).includes(action)}
                                                    onCheckedChange={() => togglePermission(resource, action)}
                                                />
                                                <label
                                                    htmlFor={`edit-${resource}-${action}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {action}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!roleName || updateMutation.isPending}
                    >
                        {updateMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// 删除角色确认对话框
function DeleteRoleDialog({ organizationId }: { organizationId: string }) {
    const { isDeleteOpen, closeDelete, selectedRole } = useOrgRolesContext()
    const deleteMutation = useDeleteOrgRole()

    const handleDelete = async () => {
        if (!selectedRole) return

        await deleteMutation.mutateAsync({
            roleId: selectedRole.id,
            organizationId
        })
        closeDelete()
    }

    return (
        <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && closeDelete()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                        确定要删除角色 "{selectedRole?.role}" 吗？此操作无法撤销。
                        已分配此角色的成员将需要重新分配角色。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        删除
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
