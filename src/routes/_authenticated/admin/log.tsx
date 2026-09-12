import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminLog } from '~/modules/audit/admin'

const logSearchSchema = tableSearchSchema.extend({
  type: z.enum(['system', 'audit']).optional().catch('system'),
})

export const Route = createFileRoute('/_authenticated/admin/log')({
  validateSearch: logSearchSchema,
  component: AdminLog,
})
