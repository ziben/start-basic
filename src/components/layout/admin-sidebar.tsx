import { useRouteContext } from '@tanstack/react-router'
import { LayoutDashboard, ScrollText } from 'lucide-react'
import { useLayout } from '~/context/layout-provider'
import { useSidebar as useDynamicSidebar } from '~/modules/system-admin/shared/sidebar'
import { iconResolver } from '@/shared/utils/icon-resolver'
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

  const baseGroups = isLoading || sidebarData.navGroups.length === 0 ? fallbackData.navGroups : sidebarData.navGroups
  const groupsWithLogs: NavGroupType[] = [
    ...baseGroups,
    {
      title: '系统',
      items: [
        {
          title: '日志',
          url: '/admin/log',
          icon: ScrollText,
        },
      ],
    },
  ]

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




