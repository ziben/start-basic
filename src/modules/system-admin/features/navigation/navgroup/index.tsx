import { ConfigDrawer } from '~/components/config-drawer'
import { useNavgroups } from '~/hooks/useNavgroupApi'
import { useTranslation } from '~/hooks/useTranslation'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NavGroupsDialogs } from './components/navgroups-dialogs'
import { NavGroupsPrimaryButtons } from './components/navgroups-primary-buttons'
import { NavGroupsProvider } from './components/navgroups-provider'
import { NavGroupsTable } from './components/navgroups-table'

export function AdminNavGroups() {
  const { t } = useTranslation()
  // 使用hooks获取数据
  const { data: navgroupList = [], isLoading, error } = useNavgroups()

  return (
    <NavGroupsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.navgroup.title')}</h2>
            <p className='text-muted-foreground'>{t('admin.navgroup.desc')}</p>
          </div>
          <NavGroupsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {/* Short-term cast: assert shape to AdminNavgroup[] until API shapes are aligned */}
          <NavGroupsTable data={navgroupList as unknown as any[]} />
        </div>
      </Main>

      <NavGroupsDialogs />
    </NavGroupsProvider>
  )
}
