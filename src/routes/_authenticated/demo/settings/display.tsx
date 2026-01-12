import { createFileRoute } from '@tanstack/react-router'
import { SettingsDisplay } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings/display')({
  component: SettingsDisplay,
})





