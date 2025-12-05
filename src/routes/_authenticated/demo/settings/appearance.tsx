import { createFileRoute } from '@tanstack/react-router'
import { SettingsAppearance } from '@/features/demo/settings/appearance'

export const Route = createFileRoute('/_authenticated/demo/settings/appearance')({
  component: SettingsAppearance,
})
