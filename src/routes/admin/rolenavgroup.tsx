import { createFileRoute } from '@tanstack/react-router'
import AdminRoleNavGroup from '~/features/admin/rolenavgroup'

export const Route = createFileRoute('/admin/rolenavgroup')({
  component: AdminRoleNavGroup,
})
