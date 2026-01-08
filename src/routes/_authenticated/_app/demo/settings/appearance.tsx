import { createFileRoute } from '@tanstack/react-router'
import { SettingsAppearance } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/_app/demo/settings/appearance')({
  component: SettingsAppearance,
})





