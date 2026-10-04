import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { RolesPage } from '~/modules/rbac'

export const Route = createFileRoute('/_authenticated/admin/rbac/roles')({
  validateSearch: tableSearchSchema,
  component: RolesPage,
})
