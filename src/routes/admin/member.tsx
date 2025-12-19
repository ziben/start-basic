import { createFileRoute } from '@tanstack/react-router'
import AdminMember from '~/features/admin/member'

export const Route = createFileRoute('/admin/member')({
  component: AdminMember,
})
