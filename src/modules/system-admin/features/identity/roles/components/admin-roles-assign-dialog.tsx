import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useRolesContext } from '../context/roles-context'
import { useAssignRoleNavGroups, useRole } from '~/modules/system-admin/shared/hooks/use-role-api'
import { useNavgroups } from '~/modules/system-admin/shared/hooks/use-navgroup-api'

export function AdminRolesAssignDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useRolesContext()
  const { data: roleData, isLoading: isLoadingRole } = useRole(currentRow?.id)
  const { data: navGroups = [], isLoading: isLoadingNav } = useNavgroups()
  const assignNavGroups = useAssignRoleNavGroups()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (roleData?.navGroups) {
      const ids = roleData.navGroups.map((rg) => rg.navGroupId)
      // 使用 setTimeout 避开同步渲染警告，或者在数据变化时才更新
      const timer = setTimeout(() => {
        setSelectedIds(ids)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [roleData?.navGroups])

  const toggleNavGroup = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleConfirm = async () => {
    if (!currentRow) return
    try {
      await assignNavGroups.mutateAsync({
        id: currentRow.id,
        navGroupIds: selectedIds,
      })
      toast.success('导航权限已更新')
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast.error('更新失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return (
    <Dialog
      open={open === 'assign'}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(null)
          setCurrentRow(null)
        }
      }}
    >
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>分配导航组</DialogTitle>
          <DialogDescription>
            为角色 "{currentRow?.label}" 分配可见的导航组
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          {isLoadingNav || isLoadingRole ? (
            <div className='flex h-40 items-center justify-center text-muted-foreground'>
              加载中...
            </div>
          ) : (
            <ScrollArea className='h-72 pr-4'>
              <div className='space-y-4'>
                {navGroups.map((group) => (
                  <div key={group.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedIds.includes(group.id)}
                      onCheckedChange={() => toggleNavGroup(group.id)}
                    />
                    <label
                      htmlFor={`group-${group.id}`}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {group.title}
                      <span className='ml-2 text-xs text-muted-foreground uppercase'>
                        ({group.scope})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(null)}>
            取消
          </Button>
          <Button disabled={assignNavGroups.isPending} onClick={handleConfirm}>
            {assignNavGroups.isPending && (
              <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
            )}
            确认分配
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
