import { getRouteApi } from '@tanstack/react-router'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { AdminLogProvider, useAdminLogContext } from './components/admin-log-provider'
import { AdminLogTable } from './components/admin-log-table'
import { AdminLogTypeSwitcher } from './components/admin-log-type-switcher'

const route = getRouteApi('/_authenticated/admin/log')

function AdminLogContent() {
  const { type } = useAdminLogContext()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <AppHeaderMain>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-x-4 space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>日志管理</h2>
          <p className='text-muted-foreground'>系统日志与操作审计记录</p>
        </div>
        <AdminLogTypeSwitcher />
      </div>
      <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
        <AdminLogTable type={type} search={search} navigate={navigate as unknown as NavigateFn} />
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
