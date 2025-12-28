import { createFileRoute } from '@tanstack/react-router'
import { AdminOrganization } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/organization')({
  component: AdminOrganization,
})

