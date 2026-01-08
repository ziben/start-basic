import { createFileRoute } from '@tanstack/react-router'
import { SettingsNotifications } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/_app/demo/settings/notifications')({
  component: SettingsNotifications,
})





