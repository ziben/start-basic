import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '~/components/config-drawer'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useTranslations } from '~/modules/admin/shared/hooks/use-translation-api'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TranslationsDialogs } from './components/translations-dialogs'
import { TranslationsPrimaryButtons } from './components/translations-primary-buttons'
import { TranslationsProvider } from './components/translations-provider'
import { TranslationsTable } from './components/translations-table'

const route = getRouteApi('/admin/translation')

export function AdminTranslations() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: translationList = [] } = useTranslations()

  return (
    <TranslationsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.translation.title') || 'Translations'}</h2>
            <p className='text-muted-foreground'>
              {t('admin.translation.desc') || 'Manage translations stored in the database.'}
            </p>
          </div>
          <TranslationsPrimaryButtons />
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <TranslationsTable data={translationList} search={search} navigate={navigate as unknown as NavigateFn} />
        </div>
      </Main>

      <TranslationsDialogs />
    </TranslationsProvider>
  )
}

export default AdminTranslations





