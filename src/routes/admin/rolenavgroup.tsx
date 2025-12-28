import { createFileRoute } from '@tanstack/react-router'
import { AdminRoleNavGroup } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/rolenavgroup')({
  component: AdminRoleNavGroup,
})
