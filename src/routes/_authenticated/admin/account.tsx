import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminAccount } from '~/modules/admin'

const adminAccountSearchSchema = tableSearchSchema.extend({
  userId: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/admin/account')({
  validateSearch: adminAccountSearchSchema,
  component: AdminAccount,
})



