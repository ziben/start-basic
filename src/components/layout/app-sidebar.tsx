import { LayoutDashboard, ListTodo, Package, MessagesSquare, Users } from 'lucide-react'
import { useLayout } from '~/shared/context/layout-provider'
import { useSidebar } from '~/modules/admin/shared/sidebar'
import { iconResolver } from '@/shared/utils/icon-resolver'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AppTitle } from './app-title'
import { SidebarSkeleton } from './sidebar-skeleton'
import type { NavGroup as NavGroupType } from './types'

// 应用程序专用侧边栏默认数据（回退或初始状态用）
function createDefaultAppSidebarData() {
  return {
    navGroups: [
      {
        title: '常规',
        items: [
          {
            title: '仪表盘',
            url: '/',
            icon: LayoutDashboard,
          },
          {
            title: '任务',
            url: '/tasks',
            icon: ListTodo,
          },
          {
            title: '应用',
            url: '/apps',
            icon: Package,
          },
          {
            title: '聊天',
            url: '/chats',
            icon: MessagesSquare,
          },
          {
            title: '用户',
            url: '/users',
            icon: Users,
          },
        ],
      },
    ] as NavGroupType[],
  }
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()

  // 从API获取作用域为 'APP' 的侧边栏数据
  const { data: sidebarData, isLoading } = useSidebar(iconResolver, 'APP')

  // 加载中时显示骨架屏
  if (isLoading) {
    return <SidebarSkeleton collapsible={collapsible} variant={variant} />
  }

  const fallbackData = createDefaultAppSidebarData()
  const navGroups = sidebarData?.navGroups?.length > 0 ? sidebarData.navGroups : fallbackData.navGroups

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props: NavGroupType) => (
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








