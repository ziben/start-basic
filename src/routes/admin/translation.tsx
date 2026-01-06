import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { AdminTranslations } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/translation')({
  validateSearch: tableSearchSchema,
  component: AdminTranslations,
})


