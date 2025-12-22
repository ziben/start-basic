import { useRouteContext } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Navigation,
  Languages,
  Building2,
  Shield,
  Key,
  UserCheck,
  Menu,
} from 'lucide-react'
import { useLayout } from '~/context/layout-provider'
import { useSidebar as useDynamicSidebar } from '~/lib/sidebar'
import { iconResolver } from '~/utils/icon-resolver'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AdminTitle } from './admin-title'
import type { NavGroup as NavGroupType } from './types'

// 管理后台专用侧边栏数据
function createAdminSidebarData() {
  return {
    navGroups: [
      {
        title: '概览',
        items: [
          {
            title: '仪表盘',
            url: '/admin',
            icon: LayoutDashboard,
          },
        ],
      },
    ] as NavGroupType[],
  }
}

export function AdminSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useRouteContext({ from: '__root__' })

  const { data: sidebarData, isLoading } = useDynamicSidebar(iconResolver, 'ADMIN')

  // 加载中时显示骨架屏（用原静态数据兜底）
  const fallbackData = createAdminSidebarData()

  // 用户信息
  const userData = {
    name: user?.name || 'Admin',
    email: user?.email || '',
    avatar: user?.image || '/avatars/admin.jpg',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AdminTitle />
      </SidebarHeader>
      <SidebarContent>
        {(isLoading || sidebarData.navGroups.length === 0 ? fallbackData.navGroups : sidebarData.navGroups).map(
          (props: NavGroupType) => (
            <NavGroupComponent key={props.title} {...props} />
          )
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
