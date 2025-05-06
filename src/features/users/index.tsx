import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { userListSchema } from './data/schema'
import { useQuery } from '@tanstack/react-query'

export default function Users() {
  const { data: userList, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // 使用正确的 API 端点来获取用户列表
        const response = await fetch('/api/users', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data) {
          return userListSchema.parse(data);
        }
        return [];
      } catch (err) {
        console.error('获取用户列表失败:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return <div>加载用户列表中...</div>;
  }

  if (error) {
    return <div>获取用户列表时出错: {error.message}</div>;
  }

  return (
    <UsersProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable
            data={userList || []}
            columns={columns}
          />
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
