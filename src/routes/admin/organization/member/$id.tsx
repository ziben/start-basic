import { createFileRoute } from '@tanstack/react-router'
import AdminMemberDetail from '~/features/admin/organization/member/detail'

export const Route = createFileRoute('/admin/organization/member/$id')({
  component: AdminMemberDetail,
})
