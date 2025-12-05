import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccount } from '@/features/demo/settings/account'

export const Route = createFileRoute('/_authenticated/demo/settings/account')({
  component: SettingsAccount,
})
