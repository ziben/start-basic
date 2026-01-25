import { RoleNavGroupManageDialog } from './role-navgroup-manage-dialog'

interface RoleNavGroupDialogsProps {
    roleId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RoleNavGroupDialogs({ roleId, open, onOpenChange }: RoleNavGroupDialogsProps) {
    return (
        <RoleNavGroupManageDialog
            roleId={roleId}
            open={open}
            onOpenChange={onOpenChange}
        />
    )
}
