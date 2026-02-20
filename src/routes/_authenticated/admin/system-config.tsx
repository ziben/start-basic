import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { createFileRoute } from '@tanstack/react-router'
import { AdminSystemConfigPage } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/system-config')({
  validateSearch: tableSearchSchema,
  component: AdminSystemConfigPage,
})
