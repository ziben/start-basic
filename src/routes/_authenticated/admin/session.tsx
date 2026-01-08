import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminSession } from '~/modules/system-admin'

export const Route = createFileRoute('/_authenticated/admin/session')({
  validateSearch: tableSearchSchema,
  component: AdminSession,
})



