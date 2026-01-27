import { createFileRoute } from '@tanstack/react-router'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { createI18nSeoHead, withI18nSeoSync } from '@/shared/hooks/use-i18n-seo'
import { AdminTranslations } from '~/modules/admin'

export const Route = createFileRoute('/_authenticated/admin/translation')({
  validateSearch: tableSearchSchema,
  head: createI18nSeoHead({
    titleKey: 'admin.translation.title',
    descriptionKey: 'admin.translation.desc',
    fallbackTitle: 'I18N',
  }),
  component: withI18nSeoSync(AdminTranslations, {
    titleKey: 'admin.translation.title',
    descriptionKey: 'admin.translation.desc',
    fallbackTitle: 'I18N',
  }),
})



