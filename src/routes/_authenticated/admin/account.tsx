import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminAccount } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/account')({
  validateSearch: tableSearchSchema,
  component: AdminAccount,
})



