import { createFileRoute } from '@tanstack/react-router'
import { SettingsProfile } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsProfile,
})
