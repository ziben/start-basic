import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { useTranslation } from '~/hooks/useTranslation'
import { createSidebarData } from './data/sidebar-data'
import { useSidebar } from '~/lib/sidebar'
import { iconResolver } from '~/utils/icon-resolver'
import type { NavGroup as NavGroupType } from './types'
import { useLayout } from '~/context/layout-provider'
import { AppTitle } from './app-title'


export function AppSidebar() {
  const { t } = useTranslation()

  // 从API获取侧边栏数据，如果失败则使用默认数据
  const { data: sidebarData, isLoading } = useSidebar(iconResolver)

  // 加载中时显示骨架屏
  if (isLoading) {
    // 使用默认数据作为骨架屏
    const defaultData = createSidebarData(t)
    const { collapsible, variant } = useLayout()
    return (
      <Sidebar collapsible={collapsible} variant={variant}>
        <SidebarHeader>
          {/* <TeamSwitcher teams={defaultData.teams} /> */}

          {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
          <AppTitle />
        </SidebarHeader>
        <SidebarContent>
          {defaultData.navGroups.map((props: NavGroupType) => (
            <NavGroupComponent key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={defaultData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }
  const { collapsible, variant } = useLayout()

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
