import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminUsers } from '~/modules/system-admin'

export const Route = createFileRoute('/_authenticated/admin/users')({
  validateSearch: tableSearchSchema,
  component: AdminUsers,
})



