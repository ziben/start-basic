import { createFileRoute } from '@tanstack/react-router'
import { AdminOrganizationCreate } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/create')({
  component: AdminOrganizationCreate,
})
