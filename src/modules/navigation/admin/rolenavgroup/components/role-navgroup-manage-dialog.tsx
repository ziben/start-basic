import { useState } from 'react'
import { QueryState } from '@/shared/components/query-state'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useNavgroups } from '~/modules/navigation/shared/navgroup/hooks/use-navgroup-api'
import { useAssignRoleNavGroups, useRole } from '~/modules/rbac/system-roles/hooks/use-role-api'
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

interface RoleNavGroupManageDialogProps {
  roleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleNavGroupManageDialog({ roleId, open, onOpenChange }: RoleNavGroupManageDialogProps) {
  const { t } = useTranslation()
  const groupsQuery = useNavgroups()
  const roleQuery = useRole(roleId ?? undefined)
  const navGroups = groupsQuery.data
  const role = roleQuery.data
  const { mutate: assignNavGroups, isPending: isAssigning } = useAssignRoleNavGroups()

  const isLoading = groupsQuery.isLoading || roleQuery.isFetching
  const error = groupsQuery.error || roleQuery.error || (!isLoading && !role ? new Error('角色不存在') : undefined)

  return (
    <RoleNavGroupManageDialogInner
      key={isLoading ? 'loading' : (role?.id ?? 'empty')}
      t={t}
      roleId={roleId}
      roleLabel={role?.displayName || role?.name}
      roleNavGroupIds={role?.navGroupLinks?.map((link) => link.navGroupId) ?? []}
      navGroups={navGroups}
      open={open}
      onOpenChange={onOpenChange}
      isLoading={isLoading}
      isAssigning={isAssigning}
      assignNavGroups={assignNavGroups}
      error={error}
      onRetry={() => {
        void groupsQuery.refetch()
        void roleQuery.refetch()
      }}
      isRetrying={groupsQuery.isFetching || roleQuery.isFetching}
    />
  )
}

type RoleNavGroupManageDialogInnerProps = {
  t: (key: string, options?: Record<string, unknown>) => string
  roleId: string | null
  roleLabel?: string | null
  roleNavGroupIds: string[]
  navGroups: Array<{ id: string; title: string; scope: string }> | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  isAssigning: boolean
  error?: unknown
  onRetry: () => void
  isRetrying: boolean
  assignNavGroups: (
    input: { id: string; navGroupIds: string[] },
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => void
}

function RoleNavGroupManageDialogInner({
  t,
  roleId,
  roleLabel,
  roleNavGroupIds,
  navGroups,
  open,
  onOpenChange,
  isLoading,
  isAssigning,
  assignNavGroups,
  error,
  onRetry,
  isRetrying,
}: RoleNavGroupManageDialogInnerProps) {
  const translatedRoleLabel = roleLabel ? t(roleLabel, { defaultMessage: roleLabel }) : '-'
  const [selectedIds, setSelectedIds] = useState<string[]>(() => Array.from(new Set(roleNavGroupIds)))

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSave = () => {
    if (!roleId || isAssigning || isLoading || error) return
    assignNavGroups(
      { id: roleId, navGroupIds: selectedIds },
      {
        onSuccess: () => {
          toast.success(t('admin.rolenavgroup.manage.toast.success'))
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(t('admin.rolenavgroup.manage.toast.error'), { description: error.message })
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isAssigning) onOpenChange(next)
      }}
    >
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('admin.rolenavgroup.manage.title')}</DialogTitle>
          <DialogDescription>{t('admin.rolenavgroup.manage.desc', { name: translatedRoleLabel })}</DialogDescription>
        </DialogHeader>

        <QueryState isLoading={isLoading} error={error} onRetry={onRetry} isRetrying={isRetrying}>
          <ScrollArea className='h-80 pr-4'>
            <div className='space-y-4'>
              {!navGroups?.length && <p className='py-8 text-center text-sm text-muted-foreground'>暂无菜单组</p>}
              {navGroups?.map((group) => (
                <div key={group.id} className='flex items-center space-x-3'>
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedIds.includes(group.id)}
                    onCheckedChange={() => handleToggle(group.id)}
                    disabled={isAssigning}
                  />
                  <div className='grid gap-1.5 leading-none'>
                    <label
                      htmlFor={`group-${group.id}`}
                      className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {t(group.title, { defaultMessage: group.title })}
                    </label>
                    <p className='text-xs text-muted-foreground'>
                      {t('admin.rolenavgroup.manage.scope', { scope: group.scope })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </QueryState>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isAssigning}>
            {t('common.buttons.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isAssigning || isLoading || !!error || !roleId}>
            {isAssigning && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t('admin.rolenavgroup.manage.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
