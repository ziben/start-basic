import { createFileRoute } from '@tanstack/react-router'
import AdminMember from '~/features/admin/organization/member'

export const Route = createFileRoute('/admin/organization/member')({
  component: AdminMember,
})
