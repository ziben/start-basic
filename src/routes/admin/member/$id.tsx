import { createFileRoute } from '@tanstack/react-router'
import AdminMemberDetail from '~/features/admin/member/detail'

export const Route = createFileRoute('/admin/member/$id')({
  component: AdminMemberDetail,
})
