import { createFileRoute } from '@tanstack/react-router'
import { SettingsProfile } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/_app/demo/settings/')({
  component: SettingsProfile,
})





