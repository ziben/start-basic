import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminLog } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/log')({
  validateSearch: tableSearchSchema,
  component: AdminLog,
})



