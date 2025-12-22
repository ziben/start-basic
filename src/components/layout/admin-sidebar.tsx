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
      {
        title: '用户管理',
        items: [
          {
            title: '用户列表',
            url: '/admin/users',
            icon: Users,
          },
          {
            title: '账户管理',
            url: '/admin/account',
            icon: UserCheck,
          },
          {
            title: '会话管理',
            url: '/admin/session',
            icon: Key,
          },
          {
            title: '验证管理',
            url: '/admin/verification',
            icon: Shield,
          },
        ],
      },
      {
        title: '导航管理',
        items: [
          {
            title: '导航管理',
            url: '/admin/navigation',
            icon: Menu,
          },
          {
            title: '角色导航分组',
            url: '/admin/rolenavgroup',
            icon: Navigation,
          },
          {
            title: '用户角色导航',
            url: '/admin/userrolenavgroup',
            icon: Navigation,
          },
        ],
      },
      {
        title: '组织管理',
        items: [
          {
            title: '组织',
            url: '/admin/organization',
            icon: Building2,
          },
          {
            title: '成员',
            url: '/admin/member',
            icon: Users,
          },
          {
            title: '邀请',
            url: '/admin/invitation',
            icon: UserCheck,
          },
        ],
      },
      {
        title: '系统设置',
        items: [
          {
            title: '翻译管理',
            url: '/admin/translation',
            icon: Languages,
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
