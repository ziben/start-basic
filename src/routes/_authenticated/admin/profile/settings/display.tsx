import { createFileRoute } from '@tanstack/react-router'
import { SettingsDisplay } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/admin/profile/settings/display')({
    component: SettingsDisplay,
})

