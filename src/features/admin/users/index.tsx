import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '~/hooks/useTranslation'
import AdminUsersTable from './components/admin-users-table'
import AdminUsersPrimaryButtons from './components/admin-users-primary-buttons'
import AdminUsersDialogs from './components/admin-users-dialogs'
import AdminUsersProvider from './context/admin-users-context'
import { useQuery } from '@tanstack/react-query'
import { adminUsersListSchema } from './data/schema'
import { authClient } from '~/lib/auth-client'

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
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.users.title', { defaultMessage: '用户管理' })}</h2>
            <p className='text-muted-foreground'>
              {t('admin.users.desc', { defaultMessage: '管理用户数据。' })}
            </p>
          </div>
          <AdminUsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminUsersTable data={userList} />
        </div>
      </Main>
      <AdminUsersDialogs />
    </AdminUsersProvider>
  )
} 