import { createFileRoute } from '@tanstack/react-router'
import AdminMemberCreate from '~/features/admin/organization/member/create'

export const Route = createFileRoute('/admin/organization/member/create')({
  component: AdminMemberCreate,
})
