import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminVerification } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/verification')({
  validateSearch: tableSearchSchema,
  component: AdminVerification,
})


