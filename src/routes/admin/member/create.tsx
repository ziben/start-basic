import { createFileRoute } from '@tanstack/react-router'
import AdminMemberCreate from '~/features/admin/member/create'

export const Route = createFileRoute('/admin/member/create')({
  component: AdminMemberCreate,
})
