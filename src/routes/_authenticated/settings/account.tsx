import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccount } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/account')({
  component: SettingsAccount,
})
