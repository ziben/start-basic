import { createFileRoute } from '@tanstack/react-router'
import { AdminTranslations } from '~/features/admin/translation'

export const Route = createFileRoute('/admin/translation')({
  component: AdminTranslations,
})
