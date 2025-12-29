import { createFileRoute } from '@tanstack/react-router'
import { AdminMemberCreate } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/member/create' as any)({
  component: AdminMemberCreate,
})


