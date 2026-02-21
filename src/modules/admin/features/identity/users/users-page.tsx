import { getRouteApi } from '@tanstack/react-router'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { AdminUsersDialogs } from './components/admin-users-dialogs'
import { AdminUsersPrimaryButtons } from './components/admin-users-primary-buttons'
import { AdminUsersProvider } from './components/admin-users-provider'
import { AdminUsersTable } from './components/admin-users-table'
import { ErrorBoundary } from '@/shared/components/error-boundary'

const route = getRouteApi('/_authenticated/admin/users')

export default function AdminUsers() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <AdminUsersProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-x-4 space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>用户管理</h2>
            <p className='text-muted-foreground'>查看并管理所有用户账号、角色与封禁状态</p>
          </div>
          <AdminUsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
          <ErrorBoundary fallbackMessage="用户表格渲染失败">
            <AdminUsersTable search={search} navigate={navigate as unknown as NavigateFn} />
          </ErrorBoundary>
        </div>
      </AppHeaderMain>

      <AdminUsersDialogs />
    </AdminUsersProvider>
  )
}
