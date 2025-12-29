import { createFileRoute } from '@tanstack/react-router'
import { AdminAccount } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/account')({
  component: AdminAccount,
})


