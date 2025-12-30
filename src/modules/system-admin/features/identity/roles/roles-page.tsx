import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { RolesProvider, useRolesContext } from './context/roles-context'
import { AdminRolesTable } from './components/admin-roles-table'
import { AdminRolesMutateDialog } from './components/admin-roles-mutate-dialog'
import { AdminRolesDeleteDialog } from './components/admin-roles-delete-dialog'
import { AdminRolesAssignDialog } from './components/admin-roles-assign-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function AdminRolesContent() {
  const { t } = useTranslation()
  const { setOpen } = useRolesContext()

  return (
    <>
      <AppHeader />
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>管理系统角色及其关联的导航权限</p>
          </div>
          <Button onClick={() => setOpen('create')}>
            <Plus className='mr-2 h-4 w-4' />
            创建角色
          </Button>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminRolesTable />
        </div>
      </Main>

      <AdminRolesMutateDialog />
      <AdminRolesDeleteDialog />
      <AdminRolesAssignDialog />
    </>
  )
}

export default function AdminRoles() {
  return (
    <RolesProvider>
      <AdminRolesContent />
    </RolesProvider>
  )
}
