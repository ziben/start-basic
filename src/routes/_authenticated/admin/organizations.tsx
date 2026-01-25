import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { OrganizationsPage } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/organizations')({
  validateSearch: tableSearchSchema,
  component: OrganizationsPage,
})

