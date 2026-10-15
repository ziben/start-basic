import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryState } from '@/shared/components/query-state'
import { toast } from 'sonner'
import { permissionsQueryKeys, roleQueryKeys } from '~/shared/lib/query-keys'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { assignPermissionsFn } from '../../server-fns/rbac.fn'
import { useRolesContext } from '../context/roles-context'
import { usePermissionsQuery } from '../hooks/use-permissions-query'
import { useRole } from '../hooks/use-role-api'

export function RolePermissionsDialog() {
  const [isSaving, setIsSaving] = useState(false)
  const { permissionsDialog, closePermissionsDialog } = useRolesContext()
  const permissionsQuery = usePermissionsQuery()
  const roleQuery = useRole(permissionsDialog.isOpen ? permissionsDialog.role?.id : undefined)
  const role = roleQuery.data
  const error =
    permissionsQuery.error || roleQuery.error || (!roleQuery.isFetching && !role ? new Error('角色不存在') : undefined)

  if (!permissionsDialog.isOpen) return null

  return (
    <Dialog
      open={permissionsDialog.isOpen}
      onOpenChange={() => {
        if (!isSaving) closePermissionsDialog()
      }}
    >
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>管理权限 - {role?.displayName ?? permissionsDialog.role?.displayName}</DialogTitle>
          <DialogDescription>为角色分配权限</DialogDescription>
        </DialogHeader>
        <QueryState
          isLoading={permissionsQuery.isLoading || roleQuery.isFetching}
          error={error}
          onRetry={() => {
            void permissionsQuery.refetch()
            void roleQuery.refetch()
          }}
          isRetrying={permissionsQuery.isFetching || roleQuery.isFetching}
        >
          <RolePermissionsDialogContent
            key={role?.id ?? 'empty'}
            role={role}
            allPermissions={permissionsQuery.data ?? []}
            closePermissionsDialog={closePermissionsDialog}
            onSavingChange={setIsSaving}
          />
        </QueryState>
      </DialogContent>
    </Dialog>
  )
}

type RolePermissionsDialogContentProps = {
  role: any
  allPermissions: any[]
  closePermissionsDialog: () => void
  onSavingChange: (saving: boolean) => void
}

function RolePermissionsDialogContent({
  role,
  allPermissions,
  closePermissionsDialog,
  onSavingChange,
}: RolePermissionsDialogContentProps) {
  const queryClient = useQueryClient()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() => {
    if (role && 'rolePermissions' in role) {
      return (role.rolePermissions as any[])?.map((rp: any) => rp.permission.id) || []
    }
    return []
  })

  const assignMutation = useMutation({
    onMutate: () => onSavingChange(true),
    onSettled: () => onSavingChange(false),
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
      queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
      toast.success('权限分配成功')
      closePermissionsDialog()
    },
    onError: (error: Error) => {
      toast.error('权限分配失败', { description: error.message })
    },
  })

  const handleSubmit = () => {
    if (assignMutation.isPending || !role || role.isSystem) return
    assignMutation.mutate(selectedPermissions)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
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
      {role?.isSystem && <p className='text-sm text-muted-foreground'>系统角色的权限由系统维护。</p>}
      <ScrollArea className='h-[min(50vh,500px)] pr-4'>
        <div className='space-y-6'>
          {allPermissions.length === 0 && (
            <p className='py-8 text-center text-sm text-muted-foreground'>暂无可分配权限</p>
          )}
          {Object.entries(groupedPermissions).map(([resourceName, permissions]) => (
            <div key={resourceName} className='space-y-2'>
              <h4 className='text-sm font-medium'>{resourceName}</h4>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {permissions.map((permission: any) => (
                  <div key={permission.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                      disabled={assignMutation.isPending || role?.isSystem}
                    />
                    <label
                      htmlFor={permission.id}
                      className='cursor-pointer text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {permission.displayName}
                      <span className='ml-1 text-xs text-muted-foreground'>({permission.code})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant='outline' onClick={closePermissionsDialog} disabled={assignMutation.isPending}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={assignMutation.isPending || !role || role.isSystem}>
          保存
        </Button>
      </DialogFooter>
    </>
  )
}
