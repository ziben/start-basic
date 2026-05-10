import type { ReactElement } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { iconResolver } from '@/shared/utils/icon-resolver'
import {
  Bot,
  Boxes,
  Building2,
  Languages,
  LayoutDashboard,
  Menu,
  ScrollText,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useSidebar as useDynamicSidebar } from '~/modules/admin/shared/sidebar'
import { useLayout } from '~/shared/context/layout-provider'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AdminTitle } from './admin-title'
import type { NavGroup as NavGroupType } from './types'

// 管理后台专用侧边栏数据
function createAdminSidebarData(): { navGroups: NavGroupType[] } {
  return {
    navGroups: [
      {
        title: '概览',
        items: [
          {
            title: '仪表盘',
            url: '/admin/dashboard',
            icon: LayoutDashboard,
          },
        ],
      },
      {
        title: '配置',
        items: [
          {
            title: '系统设置',
            url: '/admin/system-config',
            icon: Settings,
          },
          {
            title: 'AI',
            url: '/admin/ai-chat',
            icon: Bot,
          },
          {
            title: '菜单管理',
            url: '/admin/navigation',
            icon: Menu,
          },
          {
            title: 'I18N管理',
            url: '/admin/translation',
            icon: Languages,
          },
        ],
      },
      {
        title: '身份与组织',
        items: [
          {
            title: '用户管理',
            url: '/admin/users',
            icon: Users,
          },
          {
            title: '系统角色',
            url: '/admin/rbac/roles',
            icon: Shield,
          },
          {
            title: '组织管理',
            url: '/admin/organizations',
            icon: Building2,
          },
        ],
      },
    ] as NavGroupType[],
  }
}

export function AdminSidebar(): ReactElement {
  const { collapsible, variant } = useLayout()
  const { user } = useRouteContext({ from: '__root__' })

  const { data: sidebarData, isLoading } = useDynamicSidebar(iconResolver, 'ADMIN')

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
      title: '诊断',
      items: [
        {
          title: '模块诊断',
          url: '/admin/modules',
          icon: Boxes,
        },
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
