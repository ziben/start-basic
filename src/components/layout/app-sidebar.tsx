import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { useTranslation } from '~/hooks/useTranslation'
import { createSidebarData, sidebarData as initialData } from './data/sidebar-data'
import { useSidebar, IconResolver } from '~/lib/sidebar'
import * as TablerIcons from '@tabler/icons-react'
import * as LucideIcons from 'lucide-react'

// 图标解析器函数，将字符串图标名称转换为组件
const iconResolver: IconResolver = (iconName) => {
  if (!iconName) return undefined

  // 处理Tabler图标 (IconXxx格式)
  if (iconName.startsWith('Icon') && TablerIcons[iconName]) {
    return TablerIcons[iconName]
  }
  
  // 处理Lucide图标
  if (LucideIcons[iconName]) {
    return LucideIcons[iconName]
  }

  // 默认返回
  return undefined
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  
  // 从API获取侧边栏数据，如果失败则使用默认数据
  const { data: sidebarData, isLoading } = useSidebar(iconResolver)
  
  // 加载中时显示骨架屏
  if (isLoading) {
    // 使用默认数据作为骨架屏
    const defaultData = createSidebarData(t)
    return (
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={defaultData.teams} />
        </SidebarHeader>
        <SidebarContent>
          {defaultData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={defaultData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }
  
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
