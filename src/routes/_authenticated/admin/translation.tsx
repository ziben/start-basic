import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminTranslations } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/translation')({
  validateSearch: tableSearchSchema,
  component: AdminTranslations,
})



