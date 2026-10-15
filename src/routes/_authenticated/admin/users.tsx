import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminUsers } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/users')({
  validateSearch: tableSearchSchema.extend({
    banned: z
      .array(z.enum(['true', 'false']))
      .optional()
      .catch(undefined),
  }),
  component: AdminUsers,
})
