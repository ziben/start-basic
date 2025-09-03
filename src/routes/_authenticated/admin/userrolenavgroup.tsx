import { createFileRoute } from '@tanstack/react-router'
import AdminUserRoleNavGroup from '~/features/admin/userrolenavgroup'

export const Route = createFileRoute('/_authenticated/admin/userrolenavgroup')({
  component: AdminUserRoleNavGroup,
}) 