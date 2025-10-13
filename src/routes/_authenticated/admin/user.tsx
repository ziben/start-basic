import { createFileRoute } from '@tanstack/react-router'
import AdminUser from '~/features/admin/users'

export const Route = createFileRoute('/_authenticated/admin/user')({
  component: AdminUser,
}) 