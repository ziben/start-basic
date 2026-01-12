import { createFileRoute } from '@tanstack/react-router'
import { SettingsNotifications } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings/notifications')({
  component: SettingsNotifications,
})





