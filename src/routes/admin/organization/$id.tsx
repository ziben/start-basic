import { createFileRoute } from '@tanstack/react-router'
import { AdminOrganizationDetail } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization/$id')({
  component: AdminOrganizationDetail,
})


