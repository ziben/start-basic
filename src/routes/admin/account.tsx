import { createFileRoute } from '@tanstack/react-router'
import AdminAccount from '~/features/admin/account'

export const Route = createFileRoute('/admin/account')({
  component: AdminAccount,
})
