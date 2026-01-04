import { AppHeaderMain } from '~/components/layout/app-header-main'
import { AdminLogProvider, useAdminLogContext } from './components/admin-log-provider'
import { AdminLogTable } from './components/admin-log-table'
import { AdminLogTypeSwitcher } from './components/admin-log-type-switcher'

function AdminLogContent() {
  const { type } = useAdminLogContext()

  return (
    <AppHeaderMain>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>日志管理</h2>
          <p className='text-muted-foreground'>系统日志与操作日志</p>
        </div>
        <AdminLogTypeSwitcher />
      </div>
      <div className='-mx-4 flex-1 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <AdminLogTable type={type} />
      </div>
    </AppHeaderMain>
  )
}

export default function AdminLog() {
  return (
    <AdminLogProvider>
      <AdminLogContent />
    </AdminLogProvider>
  )
}

