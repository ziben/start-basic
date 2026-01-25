import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminVerification } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/verification')({
  validateSearch: tableSearchSchema,
  component: AdminVerification,
})



