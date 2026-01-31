import { createFileRoute } from '@tanstack/react-router'
import { SettingsAppearance } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/admin/settings/appearance')({
    component: SettingsAppearance,
})
