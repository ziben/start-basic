import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '~/hooks/useTranslation'
import AdminUserTable from './components/admin-user-table'
import AdminUserPrimaryButtons from './components/admin-user-primary-buttons'
import AdminUserDialogs from './components/admin-user-dialogs'
import AdminUserProvider from './context/admin-user-context'
import { useQuery } from '@tanstack/react-query'
import { adminUserListSchema } from './data/schema'
import { authClient } from '~/lib/auth-client'

export default function AdminUser() {
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
      return adminUserListSchema.parse(res.data.users)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (
    <AdminUserProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.user.title', { defaultMessage: '用户管理' })}</h2>
            <p className='text-muted-foreground'>
              {t('admin.user.desc', { defaultMessage: '管理用户数据。' })}
            </p>
          </div>
          <AdminUserPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminUserTable data={userList} />
        </div>
      </Main>
      <AdminUserDialogs />
    </AdminUserProvider>
  )
} 