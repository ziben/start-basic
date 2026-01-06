import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { OrganizationsPage } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organizations')({
  validateSearch: tableSearchSchema,
  component: OrganizationsPage,
})
