import { createFileRoute } from '@tanstack/react-router'
import { SettingsAppearance } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings/appearance')({
  component: SettingsAppearance,
})





