import { useNavgroups } from '~/hooks/useNavgroupApi'
import { useNavitems } from '~/hooks/useNavitemApi'
import { useTranslation } from '~/hooks/useTranslation'
import { Route as NavigationRoute } from '~/routes/admin/navigation'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NavGroupsDialogs } from '../navgroup/components/navgroups-dialogs'
import { NavGroupsPrimaryButtons } from '../navgroup/components/navgroups-primary-buttons'
import { NavGroupsProvider } from '../navgroup/components/navgroups-provider'
import { NavGroupsTable } from '../navgroup/components/navgroups-table'
import AdminNavItemDialogs from '../navitem/components/admin-navitem-dialogs'
import AdminNavItemPrimaryButtons from '../navitem/components/admin-navitem-primary-buttons'
import AdminNavItemTable from '../navitem/components/admin-navitem-table'
import AdminNavItemProvider from '../navitem/context/admin-navitem-context'

export default function AdminNavigationPage() {
  const { t } = useTranslation()
  const { tab, navGroupId } = NavigationRoute.useSearch()
  const navigate = NavigationRoute.useNavigate()
  const search = NavigationRoute.useSearch()

  const { data: navgroupList = [], error: navgroupsError } = useNavgroups()

  const { data: navItemList = [], isLoading: navitemsLoading, error: navitemsError } = useNavitems(undefined, 'ADMIN')

  return (
    <HeaderAndMain>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{t('admin.navigation.title', { defaultMessage: '导航管理' })}</h2>
          <p className='text-muted-foreground'>
            {t('admin.navigation.desc', { defaultMessage: '统一管理导航分组与导航项。' })}
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          navigate({ search: (prev) => ({ ...prev, tab: value as 'groups' | 'items' }) })
        }}
      >
        <TabsList>
          <TabsTrigger value='groups'>{t('admin.navigation.tabs.groups', { defaultMessage: '导航分组' })}</TabsTrigger>
          <TabsTrigger value='items'>{t('admin.navigation.tabs.items', { defaultMessage: '导航项' })}</TabsTrigger>
        </TabsList>

        <TabsContent value='groups'>
          <NavGroupsProvider>
            <div className='mb-2 flex items-center justify-end'>
              <NavGroupsPrimaryButtons />
            </div>
            <NavGroupsTable data={navgroupList as any[]} search={search} navigate={navigate as any} />
            <NavGroupsDialogs />
          </NavGroupsProvider>
        </TabsContent>

        <TabsContent value='items'>
          <AdminNavItemProvider initialNavGroupId={navGroupId}>
            <div className='mb-2 flex items-center justify-end'>
              <AdminNavItemPrimaryButtons navGroupId={navGroupId} />
            </div>
            <AdminNavItemTable data={navItemList} isLoading={navitemsLoading} error={navitemsError as any} navGroupId={navGroupId} />
            <AdminNavItemDialogs />
          </AdminNavItemProvider>
        </TabsContent>
      </Tabs>

      {/* keep existing loading/error behaviors minimal */}
      {navgroupsError ? (
        <div className='py-4 text-sm text-red-500'>
          {t('admin.navigation.errors.navgroups', { defaultMessage: '加载导航分组失败' })}: {String(navgroupsError)}
        </div>
      ) : null}
      {navitemsError ? (
        <div className='py-4 text-sm text-red-500'>
          {t('admin.navigation.errors.navitems', { defaultMessage: '加载导航项失败' })}: {String(navitemsError)}
        </div>
      ) : null}
    </HeaderAndMain>
  )
}

function HeaderAndMain({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>{children}</Main>
    </>
  )
}
