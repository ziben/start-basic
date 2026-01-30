import { createFileRoute } from '@tanstack/react-router'
import { SettingsDisplay } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/display')({
  component: SettingsDisplay,
})
