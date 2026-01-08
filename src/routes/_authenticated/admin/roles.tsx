import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminRoles } from '~/modules/system-admin/features/identity/roles'

export const Route = createFileRoute('/_authenticated/admin/roles')({
  validateSearch: tableSearchSchema,
  component: AdminRoles,
})

