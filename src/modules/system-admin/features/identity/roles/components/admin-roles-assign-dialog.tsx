import { useState, useEffect, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, CheckSquare, Square } from 'lucide-react'
import { useRolesContext } from '../context/roles-context'
import { useAssignRoleNavGroups, useRole } from '~/modules/system-admin/shared/hooks/use-role-api'
import { useNavgroups } from '~/modules/system-admin/shared/hooks/use-navgroup-api'

export function AdminRolesAssignDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useRolesContext()
  const { data: roleData, isLoading: isLoadingRole } = useRole(currentRow?.id)
  const { data: navGroups = [], isLoading: isLoadingNav } = useNavgroups()
  const assignNavGroups = useAssignRoleNavGroups()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (roleData?.navGroups) {
      const ids = roleData.navGroups.map((rg: any) => rg.navGroupId)
      const timer = setTimeout(() => {
        setSelectedIds(ids)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [roleData?.navGroups])

  // Reset search when dialog closes
  useEffect(() => {
    if (open !== 'assign') {
      setSearchQuery('')
    }
  }, [open])

  const toggleNavGroup = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const filteredIds = filteredGroups.map((g) => g.id)
    setSelectedIds((prev) => {
      const allSelected = filteredIds.every((id) => prev.includes(id))
      if (allSelected) {
        return prev.filter((id) => !filteredIds.includes(id))
      } else {
        return [...new Set([...prev, ...filteredIds])]
      }
    })
  }

  const handleConfirm = async () => {
    if (!currentRow) return
    try {
      await assignNavGroups.mutateAsync({
        id: currentRow.id,
        navGroupIds: selectedIds,
      })
      toast.success('菜单权限已更新')
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast.error('更新失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  // Filter and group navGroups
  const filteredGroups = useMemo(() => {
    return navGroups.filter((group: any) =>
      group.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [navGroups, searchQuery])

  const groupedByScope = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredGroups.forEach((group: any) => {
      const scope = group.scope || 'APP'
      if (!groups[scope]) groups[scope] = []
      groups[scope].push(group)
    })
    return groups
  }, [filteredGroups])

  const allFilteredSelected = filteredGroups.length > 0 && filteredGroups.every((g: any) => selectedIds.includes(g.id))

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
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>分配菜单组</DialogTitle>
          <DialogDescription>
            为角色 <span className='font-semibold text-foreground'>"{currentRow?.label}"</span> 分配可访问的菜单组
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search and Select All */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='搜索菜单组...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              disabled={filteredGroups.length === 0}
            >
              {allFilteredSelected ? (
                <>
                  <Square className='mr-2 h-4 w-4' />
                  全不选
                </>
              ) : (
                <>
                  <CheckSquare className='mr-2 h-4 w-4' />
                  全选
                </>
              )}
            </Button>
          </div>

          {/* Selected count */}
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>
              已选择 <span className='font-semibold text-foreground'>{selectedIds.length}</span> / {navGroups.length} 个菜单组
            </span>
            {searchQuery && (
              <span>
                筛选结果: {filteredGroups.length} 个
              </span>
            )}
          </div>

          {/* Menu Groups List */}
          {isLoadingNav || isLoadingRole ? (
            <div className='flex h-64 items-center justify-center text-muted-foreground'>
              <div className='flex flex-col items-center gap-2'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
                <span>加载中...</span>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className='flex h-64 items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <Search className='mx-auto h-12 w-12 opacity-20' />
                <p className='mt-2'>未找到匹配的菜单组</p>
              </div>
            </div>
          ) : (
            <ScrollArea className='h-64 pr-4'>
              <div className='space-y-6'>
                {Object.entries(groupedByScope).map(([scope, groups]) => (
                  <div key={scope}>
                    <div className='mb-3 flex items-center gap-2'>
                      <Badge variant={scope === 'ADMIN' ? 'destructive' : 'default'}>
                        {scope === 'ADMIN' ? '管理后台' : '应用前台'}
                      </Badge>
                      <Separator className='flex-1' />
                    </div>
                    <div className='space-y-3'>
                      {groups.map((group: any) => (
                        <div
                          key={group.id}
                          className='flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-accent'
                        >
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedIds.includes(group.id)}
                            onCheckedChange={() => toggleNavGroup(group.id)}
                            className='mt-0.5'
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className='flex-1 cursor-pointer space-y-1'
                          >
                            <div className='font-medium leading-none'>{group.title}</div>
                            {group.navItems && group.navItems.length > 0 && (
                              <div className='text-xs text-muted-foreground'>
                                包含 {group.navItems.length} 个菜单项
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
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
