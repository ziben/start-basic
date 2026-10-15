import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminTranslations } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/translation')({
  validateSearch: tableSearchSchema.extend({
    locale: z
      .array(z.enum(['zh', 'en']))
      .optional()
      .catch(undefined),
  }),
  component: AdminTranslations,
})
