import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccount } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/admin/profile/settings/account')({
    component: SettingsAccount,
})

