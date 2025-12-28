import { createFileRoute } from '@tanstack/react-router'
import { AdminTranslations } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/translation')({
  component: AdminTranslations,
})

