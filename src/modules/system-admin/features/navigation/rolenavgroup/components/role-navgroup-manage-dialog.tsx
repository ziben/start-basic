import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavgroups } from '@/modules/system-admin/shared/hooks/use-navgroup-api'
import { useAssignRoleNavGroups, useRole } from '@/modules/system-admin/shared/hooks/use-role-api'
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
    const { data: navGroups, isLoading: isNavGroupsLoading } = useNavgroups()
    const { data: role, isLoading: isRoleLoading } = useRole(roleId ?? undefined)
    const { mutate: assignNavGroups, isPending: isAssigning } = useAssignRoleNavGroups()

    const [selectedIds, setSelectedIds] = useState<string[]>([])

    useEffect(() => {
        if (role?.navGroups) {
            const ids = role.navGroups.map((rng: any) => rng.navGroupId)
            setSelectedIds(ids)
        } else {
            setSelectedIds([])
        }
    }, [role])

    const handleToggle = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const handleSave = () => {
        if (!roleId) return

        assignNavGroups(
            { id: roleId, navGroupIds: selectedIds },
            {
                onSuccess: () => {
                    toast.success('分配成功')
                    onOpenChange(false)
                },
                onError: (error) => {
                    toast.error(`提交失败: ${error.message}`)
                },
            }
        )
    }

    const isLoading = isNavGroupsLoading || isRoleLoading

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>管理角色导航组</DialogTitle>
                    <DialogDescription>
                        为角色 <strong>{role?.label || role?.name}</strong> 分配可见的导航组。
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
                                            {group.title}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            作用域: {group.scope}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={isAssigning || isLoading}>
                        {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存更改
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
