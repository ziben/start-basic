import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminUserRoleNavGroup } from '~/modules/system-admin'

export const Route = createFileRoute('/_authenticated/admin/userrolenavgroup')({
  validateSearch: tableSearchSchema,
  component: AdminUserRoleNavGroup,
})



