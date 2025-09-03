import { createFileRoute } from '@tanstack/react-router'
import AdminAccount from '~/features/admin/account'

export const Route = createFileRoute('/_authenticated/admin/account')({
  component: AdminAccount,
}) 