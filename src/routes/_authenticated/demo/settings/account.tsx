import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccount } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings/account')({
  component: SettingsAccount,
})





