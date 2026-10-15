import { QueryState } from '@/shared/components/query-state'
import { toTableNavigate } from '@/shared/hooks/use-table-url-state'
import { AppHeaderMain } from '~/components/layout/app-header-main'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useNavgroups } from '~/modules/navigation/shared/navgroup/hooks/use-navgroup-api'
import { useNavitems } from '~/modules/navigation/shared/navitem/hooks/use-navitem-api'
import { Route as NavigationRoute } from '~/routes/_authenticated/admin/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
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
  const activeTab = tab ?? 'groups'
  const navigate = NavigationRoute.useNavigate()
  const search = NavigationRoute.useSearch()
  const tableNavigate = toTableNavigate(navigate)

  const {
    data: navgroupList = [],
    isLoading: navgroupsLoading,
    error: navgroupsError,
    refetch: refetchGroups,
    isRefetching: isRefetchingGroups,
  } = useNavgroups()

  const {
    data: navItemList = [],
    isLoading: navitemsLoading,
    error: navitemsError,
    refetch: refetchItems,
    isRefetching: isRefetchingItems,
  } = useNavitems(undefined, 'ADMIN')

  return (
    <AppHeaderMain fixed>
      <PageHeader
        hide={false}
        title={t('admin.navigation.title', { defaultMessage: '菜单管理' })}
        description={t('admin.navigation.desc', { defaultMessage: '统一管理菜单分组与菜单项。' })}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          navigate({ search: (prev) => ({ ...prev, tab: value as 'groups' | 'items' }) })
        }}
        className='flex min-h-0 flex-1 flex-col'
      >
        <TabsList>
          <TabsTrigger value='groups'>{t('admin.navigation.tabs.groups', { defaultMessage: '菜单分组' })}</TabsTrigger>
          <TabsTrigger value='items'>{t('admin.navigation.tabs.items', { defaultMessage: '菜单项' })}</TabsTrigger>
        </TabsList>

        <TabsContent value='groups' className='flex min-h-0 flex-1 flex-col'>
          <NavGroupsProvider>
            <div className='mb-2 flex items-center justify-end'>
              <NavGroupsPrimaryButtons />
            </div>
            <NavGroupsTable
              data={navgroupList}
              search={search as Record<string, unknown>}
              navigate={tableNavigate}
              onReload={() => void refetchGroups()}
              isReloading={isRefetchingGroups}
              isLoading={navgroupsLoading}
              errorState={
                navgroupsError ? (
                  <QueryState
                    error={navgroupsError}
                    onRetry={() => void refetchGroups()}
                    isRetrying={isRefetchingGroups}
                  />
                ) : undefined
              }
            />
            <NavGroupsDialogs />
          </NavGroupsProvider>
        </TabsContent>

        <TabsContent value='items' className='flex min-h-0 flex-1 flex-col'>
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
    </AppHeaderMain>
  )
}
