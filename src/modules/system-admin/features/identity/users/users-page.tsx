import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { AdminUsersDialogs } from './components/admin-users-dialogs'
import { AdminUsersPrimaryButtons } from './components/admin-users-primary-buttons'
import { AdminUsersProvider } from './components/admin-users-provider'
import { AdminUsersTable } from './components/admin-users-table'
import { AppHeaderMain } from '~/components/layout/app-header-main'

const route = getRouteApi('/_authenticated/admin/users')

export default function AdminUsers() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <AdminUsersProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.user.title')}</h2>
            <p className='text-muted-foreground'>{t('admin.user.desc')}</p>
          </div>
          <AdminUsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminUsersTable search={search} navigate={navigate as unknown as NavigateFn} />
        </div>
      </AppHeaderMain>

      <AdminUsersDialogs />
    </AdminUsersProvider>
  )
}






