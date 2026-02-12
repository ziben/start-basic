import { ConfigDrawer } from '~/components/config-drawer'
import { useNavgroups } from '~/modules/admin/shared/hooks/use-navgroup-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { NavGroupsDialogs } from './components/navgroups-dialogs'
import { NavGroupsPrimaryButtons } from './components/navgroups-primary-buttons'
import { NavGroupsProvider } from './components/navgroups-provider'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { NavGroupsTable } from './components/navgroups-table'

export function AdminNavGroups() {
  const { t } = useTranslation()
  // 使用hooks获取数据
  const { data: navgroupList = [], isLoading, error } = useNavgroups()

  return (
    <NavGroupsProvider>
      

      <AppHeaderMain>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.navgroup.title')}</h2>
            <p className='text-muted-foreground'>{t('admin.navgroup.desc')}</p>
          </div>
          <NavGroupsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <NavGroupsTable data={navgroupList} />
        </div>
      </AppHeaderMain>

      <NavGroupsDialogs />
    </NavGroupsProvider>
  )
}







