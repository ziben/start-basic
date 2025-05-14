import { createFileRoute } from '@tanstack/react-router'
import AdminUser from '~/features/admin/user'

export const Route = createFileRoute('/_authenticated/admin/user')({
  component: AdminUser,
}) 