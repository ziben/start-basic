import { useState } from 'react'
import { toast } from 'sonner'
import { useNavgroups } from '@/modules/system-admin/shared/hooks/use-navgroup-api'
import { useAssignRoleNavGroups, useRole } from '@/modules/system-admin/shared/hooks/use-role-api'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
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
import { Loader2 } from 'lucide-react'

interface RoleNavGroupManageDialogProps {
    roleId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RoleNavGroupManageDialog({
    roleId,
    open,
    onOpenChange,
}: RoleNavGroupManageDialogProps) {
    const { t } = useTranslation()
    const { data: navGroups, isLoading: isNavGroupsLoading } = useNavgroups()
    const { data: role, isLoading: isRoleLoading } = useRole(roleId ?? undefined)
    const { mutate: assignNavGroups, isPending: isAssigning } = useAssignRoleNavGroups()

    const isLoading = isNavGroupsLoading || isRoleLoading

    return (
        <RoleNavGroupManageDialogInner
            key={role?.id ?? 'empty'}
            t={t}
            roleId={roleId}
            roleLabel={role?.label || role?.name}
            roleNavGroupIds={role?.roleNavGroups?.map((rng: any) => rng.navGroupId) ?? []}
            navGroups={navGroups}
            open={open}
            onOpenChange={onOpenChange}
            isLoading={isLoading}
            isAssigning={isAssigning}
            assignNavGroups={assignNavGroups}
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
    assignNavGroups: (input: { id: string; navGroupIds: string[] }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
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
}: RoleNavGroupManageDialogInnerProps) {
    const translatedRoleLabel = roleLabel ? t(roleLabel, { defaultMessage: roleLabel }) : '-'
    const [selectedIds, setSelectedIds] = useState<string[]>(() => Array.from(new Set(roleNavGroupIds)))

    const handleToggle = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
    }

    const handleSave = () => {
        if (!roleId) return
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.rolenavgroup.manage.title')}</DialogTitle>
                    <DialogDescription>
                        {t('admin.rolenavgroup.manage.desc', { name: translatedRoleLabel })}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-60 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-4">
                            {navGroups?.map((group) => (
                                <div key={group.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`group-${group.id}`}
                                        checked={selectedIds.includes(group.id)}
                                        onCheckedChange={() => handleToggle(group.id)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={`group-${group.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {t(group.title, { defaultMessage: group.title })}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('admin.rolenavgroup.manage.scope', { scope: group.scope })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
                        {t('common.buttons.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isAssigning || isLoading}>
                        {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('admin.rolenavgroup.manage.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
