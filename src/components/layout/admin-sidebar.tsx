import type { ReactElement } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { iconResolver } from '@/shared/utils/icon-resolver'
import { useSidebar as useDynamicSidebar } from '~/modules/admin/shared/sidebar'
import { useLayout } from '~/shared/context/layout-provider'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { createAdminSidebarData } from '@/components/layout/data/sidebar-data'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AdminTitle } from './admin-title'
import type { NavGroup as NavGroupType } from './types'

export function AdminSidebar(): ReactElement {
  const { collapsible, variant } = useLayout()
  const { user } = useRouteContext({ from: '__root__' })

  const { data: sidebarData, isLoading } = useDynamicSidebar(iconResolver, 'ADMIN')

  const fallbackData = createAdminSidebarData((key) => key)

  // 用户信息
  const userData = {
    name: user?.name || 'Admin',
    email: user?.email || '',
    avatar: user?.image || '/avatars/admin.jpg',
  }

  const baseGroups = isLoading || sidebarData.navGroups.length === 0 ? fallbackData.navGroups : sidebarData.navGroups
  const groupsWithLogs: NavGroupType[] = baseGroups

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AdminTitle />
      </SidebarHeader>
      <SidebarContent>
        {groupsWithLogs.map((props: NavGroupType) => (
          <NavGroupComponent key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
