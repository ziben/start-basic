import { createFileRoute } from '@tanstack/react-router'
import AdminInvitation from '~/features/admin/invitation'

export const Route = createFileRoute('/admin/invitation')({
  component: AdminInvitation,
})
