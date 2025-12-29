import { createFileRoute } from '@tanstack/react-router'
import { AdminMemberDetail } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/member/$id' as any)({
  component: AdminMemberDetail,
})


