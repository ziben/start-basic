import { useNavgroups } from '~/modules/admin/features/navigation/navgroup/hooks/use-navgroup-api'
import { useNavitems } from '~/modules/admin/features/navigation/navitem/hooks/use-navitem-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Route as NavigationRoute } from '~/routes/_authenticated/admin/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NavGroupsDialogs } from '../navgroup/components/navgroups-dialogs'
import { NavGroupsPrimaryButtons } from '../navgroup/components/navgroups-primary-buttons'
import { NavGroupsProvider } from '../navgroup/components/navgroups-provider'
import { NavGroupsTable } from '../navgroup/components/navgroups-table'
import AdminNavItemDialogs from '../navitem/components/admin-navitem-dialogs'
import AdminNavItemPrimaryButtons from '../navitem/components/admin-navitem-primary-buttons'
import AdminNavItemTable from '../navitem/components/admin-navitem-table'
import AdminNavItemProvider from '../navitem/context/admin-navitem-context'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { PageHeader } from '@/components/layout/page-header'

export default function AdminNavigationPage() {
  const { t } = useTranslation()
  const { tab, navGroupId } = NavigationRoute.useSearch()
  const navigate = NavigationRoute.useNavigate()
  const search = NavigationRoute.useSearch()

  const { data: navgroupList = [], error: navgroupsError, refetch: refetchGroups, isRefetching: isRefetchingGroups } = useNavgroups()

  const { data: navItemList = [], isLoading: navitemsLoading, error: navitemsError, refetch: refetchItems, isRefetching: isRefetchingItems } = useNavitems(undefined, 'ADMIN')

  return (
    <AppHeaderMain>
      <PageHeader
        title={t('admin.navigation.title', { defaultMessage: '菜单管理' })}
        description={t('admin.navigation.desc', { defaultMessage: '统一管理菜单分组与菜单项。' })}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          navigate({ search: (prev) => ({ ...prev, tab: value as 'groups' | 'items' }) })
        }}
      >
        <TabsList>
          <TabsTrigger value='groups'>{t('admin.navigation.tabs.groups', { defaultMessage: '菜单分组' })}</TabsTrigger>
          <TabsTrigger value='items'>{t('admin.navigation.tabs.items', { defaultMessage: '菜单项' })}</TabsTrigger>
        </TabsList>

        <TabsContent value='groups'>
          <NavGroupsProvider>
            <div className='mb-2 flex items-center justify-end'>
              <NavGroupsPrimaryButtons />
            </div>
            <NavGroupsTable 
              data={navgroupList} 
              search={search as Record<string, unknown>} 
              navigate={navigate}
              onReload={() => void refetchGroups()}
              isReloading={isRefetchingGroups}
            />
            <NavGroupsDialogs />
          </NavGroupsProvider>
        </TabsContent>

        <TabsContent value='items'>
          <AdminNavItemProvider initialNavGroupId={navGroupId}>
            <div className='mb-2 flex items-center justify-end'>
              <AdminNavItemPrimaryButtons navGroupId={navGroupId} />
            </div>
            <AdminNavItemTable
              data={navItemList}
              isLoading={navitemsLoading}
              error={navitemsError}
              navGroupId={navGroupId}
              onReload={() => void refetchItems()}
              isReloading={isRefetchingItems}
            />
            <AdminNavItemDialogs />
          </AdminNavItemProvider>
        </TabsContent>
      </Tabs>

      {/* keep existing loading/error behaviors minimal */}
      {navgroupsError ? (
        <div className='py-4 text-sm text-red-500'>
          {t('admin.navigation.errors.navgroups', { defaultMessage: '加载菜单分组失败' })}: {String(navgroupsError)}
        </div>
      ) : null}
      {navitemsError ? (
        <div className='py-4 text-sm text-red-500'>
          {t('admin.navigation.errors.navitems', { defaultMessage: '加载菜单项失败' })}: {String(navitemsError)}
        </div>
      ) : null}
    </AppHeaderMain>
  )
}