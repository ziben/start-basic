import { createFileRoute } from '@tanstack/react-router'
import { SettingsNotifications } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/admin/settings/notifications')({
    component: SettingsNotifications,
})
