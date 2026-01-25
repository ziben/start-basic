import { useLayout } from '~/shared/context/layout-provider'
import { useSidebar } from '~/modules/admin/shared/sidebar'
import { iconResolver } from '@/shared/utils/icon-resolver'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AppTitle } from './app-title'
import { SidebarSkeleton } from './sidebar-skeleton'
import type { NavGroup as NavGroupType } from './types'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()

  // 从API获取侧边栏数据，如果失败则使用默认数据
  const { data: sidebarData, isLoading } = useSidebar(iconResolver)

  // 加载中时显示骨架屏
  if (isLoading) {
    return <SidebarSkeleton collapsible={collapsible} variant={variant} />
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={sidebarData.teams} /> */}
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props: NavGroupType) => (
          <NavGroupComponent key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}








