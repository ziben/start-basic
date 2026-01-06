import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminSession } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/session')({
  validateSearch: tableSearchSchema,
  component: AdminSession,
})


