import { createFileRoute } from '@tanstack/react-router'
import { SettingsProfile } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings/')({
  component: SettingsProfile,
})




