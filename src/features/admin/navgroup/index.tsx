import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '~/hooks/useTranslation'
import AdminNavgroupTable from './components/admin-navgroup-table'
import AdminNavgroupPrimaryButtons from './components/admin-navgroup-primary-buttons'
import AdminNavgroupDialogs from './components/admin-navgroup-dialogs'
import AdminNavgroupProvider from './context/admin-navgroup-context'
import { useNavgroups } from '~/hooks/useNavgroupApi'

export default function AdminNavgroupPage() {
  const { t } = useTranslation()
  // 使用hooks获取数据
  const { data: navgroupList = [], isLoading, error } = useNavgroups()

  return (
    <AdminNavgroupProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>{t('admin.navgroup.title', { defaultMessage: '导航组管理' })}</h2>
            <p className='text-muted-foreground'>
              {t('admin.navgroup.desc', { defaultMessage: '管理导航组数据。' })}
            </p>
          </div>
          <AdminNavgroupPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <AdminNavgroupTable data={navgroupList} isLoading={isLoading} error={error as Error | null} />
        </div>
      </Main>
      <AdminNavgroupDialogs />
    </AdminNavgroupProvider>
  )
}