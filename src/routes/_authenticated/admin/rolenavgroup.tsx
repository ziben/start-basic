import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminRoleNavGroup } from '~/modules/system-admin'

export const Route = createFileRoute('/_authenticated/admin/rolenavgroup')({
  validateSearch: tableSearchSchema,
  component: AdminRoleNavGroup,
})



