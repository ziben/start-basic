import { createFileRoute } from '@tanstack/react-router'
import AdminMember from '~/features/admin/member'

export const Route = createFileRoute('/_authenticated/admin/member')({
  component: AdminMember,
}) 