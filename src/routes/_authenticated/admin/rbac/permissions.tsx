import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { PermissionsPage } from '@/modules/system-admin/features/rbac'

export const Route = createFileRoute('/_authenticated/admin/rbac/permissions')({
  validateSearch: tableSearchSchema,
  component: PermissionsPage,
})
