import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignOrganizationRolePermissionsFn, getOrganizationRolePermissionsFn } from '@/modules/system-admin/shared/server-fns/organization-role.fn'
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
import { rbacOrgRolesQueryKeys } from '~/shared/lib/query-keys'
import { useOrgRolesContext } from '../context/org-roles-context'
import { usePermissionsQuery } from '../../permissions/hooks/use-permissions-queries'

export function OrgRolePermissionsDialog() {
  const { permissionsDialog, closePermissionsDialog } = useOrgRolesContext()
  const queryClient = useQueryClient()
  const { data: allPermissions = [] } = usePermissionsQuery()

  const role = permissionsDialog.data
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useEffect(() => {
    async function fetchPermissions() {
      if (permissionsDialog.isOpen && role?.id) {
        try {
          const res = await getOrganizationRolePermissionsFn({ data: { organizationRoleId: role.id } })
          setSelectedPermissions(res.map((p: any) => p.permissionId))
        } catch (_error) {
          toast.error('加载权限失败')
        }
      }
    }
    fetchPermissions()
  }, [permissionsDialog.isOpen, role?.id])

  const assignMutation = useMutation({
    mutationFn: (permissionIds: string[]) => {
      if (!role?.id) throw new Error('角色不存在')
      return assignOrganizationRolePermissionsFn({
        data: {
          organizationRoleId: role.id,
          permissionIds,
          dataScope: 'ORG', // 默认组织范围
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacOrgRolesQueryKeys.all })
      toast.success('权限分配成功')
      closePermissionsDialog()
    },
    onError: (error: Error) => {
      toast.error('分配失败', { description: error.message })
    },
  })

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // 按分类分组
  const groupedPermissions = allPermissions.reduce((acc: any, p: any) => {
    const category = p.category || '未分类'
    if (!acc[category]) acc[category] = []
    acc[category].push(p)
    return acc
  }, {})

  return (
    <Dialog open={permissionsDialog.isOpen} onOpenChange={closePermissionsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>分配权限 - {role?.displayName}</DialogTitle>
          <DialogDescription>设置组织角色的功能访问权限</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold border-b pb-1">{category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((p: any) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={p.id} 
                        checked={selectedPermissions.includes(p.id)}
                        onCheckedChange={() => togglePermission(p.id)}
                      />
                      <label htmlFor={p.id} className="text-sm cursor-pointer truncate">
                        {p.displayName} <span className="text-[10px] text-muted-foreground">({p.code})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={closePermissionsDialog}>取消</Button>
          <Button onClick={() => assignMutation.mutate(selectedPermissions)} disabled={assignMutation.isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
