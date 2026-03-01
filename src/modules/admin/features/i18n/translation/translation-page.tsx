import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '~/components/config-drawer'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useTranslations } from '~/modules/admin/features/i18n/translation/hooks/use-translation-api'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { TranslationsDialogs } from './components/translations-dialogs'
import { TranslationsPrimaryButtons } from './components/translations-primary-buttons'
import { TranslationsProvider } from './components/translations-provider'
import { TranslationsTable } from './components/translations-table'

const route = getRouteApi('/_authenticated/admin/translation')

export function AdminTranslations() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: translationList = [] } = useTranslations()

  return (
    <TranslationsProvider>
      <AppHeaderMain fixed>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.translation.title') || 'Translations'}</h2>
            <p className='text-muted-foreground'>
              {t('admin.translation.desc') || 'Manage translations stored in the database.'}
            </p>
          </div>
          <TranslationsPrimaryButtons />
        </div>

        <div className='-mx-4 flex flex-1 flex-col overflow-hidden px-4 py-1'>
          <TranslationsTable data={translationList} search={search} navigate={navigate as unknown as NavigateFn} />
        </div>
      </AppHeaderMain>

      <TranslationsDialogs />
    </TranslationsProvider>
  )
}

export default AdminTranslations





