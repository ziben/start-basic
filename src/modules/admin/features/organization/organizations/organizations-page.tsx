import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { OrganizationsDialogs } from './components/organizations-dialogs'
import { OrganizationsPrimaryButtons } from './components/organizations-primary-buttons'
import { OrganizationsProvider } from './components/organizations-provider'
import { OrganizationsTable } from './components/organizations-table'

const route = getRouteApi('/_authenticated/admin/organizations')

export default function OrganizationsPage() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <OrganizationsProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('admin.organization.title', { defaultMessage: '组织管理' })}
            </h2>
            <p className='text-muted-foreground'>
              {t('admin.organization.desc', { defaultMessage: '管理系统中的所有组织' })}
            </p>
          </div>
          <OrganizationsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <OrganizationsTable search={search} navigate={navigate as unknown as NavigateFn} />
        </div>
      </AppHeaderMain>

      <OrganizationsDialogs />
    </OrganizationsProvider>
  )
}
