import { createFileRoute } from '@tanstack/react-router'
import { AdminMember } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/member' as any)({
  component: AdminMember,
})
