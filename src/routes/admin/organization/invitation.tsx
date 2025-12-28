import { createFileRoute } from '@tanstack/react-router'
import { AdminInvitation } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/invitation' as any)({
  component: AdminInvitation,
})
