import { createFileRoute } from '@tanstack/react-router'
import { AdminUserRoleNavGroup } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/userrolenavgroup')({
  component: AdminUserRoleNavGroup,
})


