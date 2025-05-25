import { createFileRoute } from '@tanstack/react-router'
import AdminUsers from '~/features/admin/users'

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsers,
}) 