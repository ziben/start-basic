import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminInvitation } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/invitations')({
  validateSearch: tableSearchSchema,
  component: AdminInvitation,
})
