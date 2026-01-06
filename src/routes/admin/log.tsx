import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminLog } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/log')({
  validateSearch: tableSearchSchema,
  component: AdminLog,
})


