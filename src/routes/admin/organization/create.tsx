import { createFileRoute } from '@tanstack/react-router'
import AdminOrganizationCreate from '~/features/admin/organization/create'

export const Route = createFileRoute('/admin/organization/create')({
  component: AdminOrganizationCreate,
})
