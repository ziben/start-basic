import { createFileRoute } from '@tanstack/react-router'
import AdminInvitation from '~/features/admin/organization/invitation'

export const Route = createFileRoute('/admin/organization/invitation')({
  component: AdminInvitation,
})
