import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '~/hooks/useTranslation'
import { authClient } from '~/lib/auth-client'
import { AdminUsersDialogs } from './components/admin-users-dialogs'
import { AdminUsersPrimaryButtons } from './components/admin-users-primary-buttons'
import { AdminUsersTable } from './components/admin-users-table'
import { adminUsersListSchema } from './data/schema'
import { AdminUsersProvider } from './components/admin-users-provider'

export default function AdminUsers() {
  const { t } = useTranslation()
  const { data: userList = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 10,
        },
      });
      if (!res.data) {
        return [];
      }
      return adminUsersListSchema.parse(res.data.users)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (
    <AdminUsersProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>导航组管理</h2>
            <p className='text-muted-foreground'>
              {t('admin.navgroup.desc', { defaultMessage: '管理导航组数据。' })}
            </p>
          </div>
          <AdminUsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminUsersTable data={userList} isLoading={isLoading} error={error as Error | null} />
        </div>
      </Main>

      <AdminUsersDialogs />
    </AdminUsersProvider>
  )
} 