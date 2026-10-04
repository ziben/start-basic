import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignPermissionsFn } from '../../server-fns/rbac.fn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { roleQueryKeys } from '~/shared/lib/query-keys'
import { useRolesContext } from '../context/roles-context'
import { usePermissionsQuery } from '../hooks/use-permissions-query'

export function RolePermissionsDialog() {
  const { permissionsDialog, closePermissionsDialog } = useRolesContext()
  const { data: allPermissions = [] } = usePermissionsQuery()

  const role = permissionsDialog.role

  return (
    <Dialog open={permissionsDialog.isOpen} onOpenChange={closePermissionsDialog}>
      <DialogContent className="max-w-3xl">
        <RolePermissionsDialogContent
          key={role?.id ?? 'empty'}
          role={role}
          allPermissions={allPermissions}
          closePermissionsDialog={closePermissionsDialog}
        />
      </DialogContent>
    </Dialog>
  )
}

type RolePermissionsDialogContentProps = {
  role: any
  allPermissions: any[]
  closePermissionsDialog: () => void
}

function RolePermissionsDialogContent({
  role,
  allPermissions,
  closePermissionsDialog,
}: RolePermissionsDialogContentProps) {
  const queryClient = useQueryClient()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() => {
    if (role && 'rolePermissions' in role) {
      return (role.rolePermissions as any[])?.map((rp: any) => rp.permission.id) || []
    }
    return []
  })

  const assignMutation = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      if (!role) throw new Error('角色不存在')
      return await assignPermissionsFn({
        data: {
          roleId: role.id,
          permissionIds,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success('权限分配成功')
      closePermissionsDialog()
    },
    onError: (error: Error) => {
      toast.error('权限分配失败', { description: error.message })
    },
  })

  const handleSubmit = () => {
    assignMutation.mutate(selectedPermissions)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const groupedPermissions = allPermissions.reduce(
    (acc: Record<string, typeof allPermissions>, permission: any) => {
      const resourceName = permission.resource.displayName
      if (!acc[resourceName]) {
        acc[resourceName] = []
      }
      acc[resourceName].push(permission)
      return acc
    },
    {} as Record<string, typeof allPermissions>
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>管理权限 - {role?.displayName}</DialogTitle>
        <DialogDescription>为角色分配权限</DialogDescription>
      </DialogHeader>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resourceName, permissions]) => (
            <div key={resourceName} className="space-y-2">
              <h4 className="font-medium text-sm">{resourceName}</h4>
              <div className="grid grid-cols-2 gap-2">
                {permissions.map((permission: any) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.displayName}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({permission.code})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={closePermissionsDialog}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={assignMutation.isPending}>
          保存
        </Button>
      </DialogFooter>
    </>
  )
}
