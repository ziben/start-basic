import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminInvitation } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/invitations')({
  validateSearch: tableSearchSchema,
  component: AdminInvitation,
})

