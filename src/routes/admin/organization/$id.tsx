import { createFileRoute } from '@tanstack/react-router'
import AdminOrganizationDetail from '~/features/admin/organization/detail'

export const Route = createFileRoute('/admin/organization/$id')({
  component: AdminOrganizationDetail,
})
