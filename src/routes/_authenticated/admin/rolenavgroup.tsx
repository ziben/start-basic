import { createFileRoute } from '@tanstack/react-router'
import AdminRoleNavGroup from '~/features/admin/rolenavgroup'

export const Route = createFileRoute('/_authenticated/admin/rolenavgroup')({
  component: AdminRoleNavGroup,
}) 