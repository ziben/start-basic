import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { AdminRolesProvider } from './components/admin-roles-provider'
import { AdminRolesTable } from './components/admin-roles-table'
import { AdminRolesPrimaryButtons } from './components/admin-roles-primary-buttons'
import { AdminRolesDialogs } from './components/admin-roles-dialogs'

export default function AdminRoles() {
  const { t } = useTranslation()

  return (
    <AdminRolesProvider>
      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>管理系统角色及其关联的菜单权限</p>
          </div>
          <AdminRolesPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminRolesTable />
        </div>
      </AppHeaderMain>

      <AdminRolesDialogs />
    </AdminRolesProvider>
  )
}
