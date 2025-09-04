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
import { useSidebar } from '~/lib/sidebar'
import { iconResolver } from '~/utils/icon-resolver'
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { PrismaClient } from '@prisma/client'
import { useLayout } from '~/context/layout-provider'
import { AppTitle } from './app-title'
const prisma = new PrismaClient()

/**
 * 获取侧边栏数据的API端点
 * 如果用户已登录，将返回根据用户角色定制的侧边栏数据
 * 否则返回默认的公共侧边栏数据
 */
export const getSidebarDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { headers } = getWebRequest()!
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id
    const role = session?.user?.role || 'public'

    // 获取侧边栏数据
    const sidebarData = await getSidebarData(userId, role)
    return sidebarData
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    throw new Error('Failed to fetch sidebar data')
  }
})


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
  const { collapsible, variant } = useLayout()

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={sidebarData.teams} /> */}
        <AppTitle />
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

// 从数据库获取侧边栏数据并转换为前端需要的格式
export async function getSidebarData(userId?: string, role?: string): Promise<SidebarData> {
  try {
    // 获取导航组
    const navGroups = await prisma.navGroup.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        navItems: {
          where: { parentId: null }, // 只获取顶级导航项
          orderBy: { orderIndex: 'asc' },
          include: {
            children: {
              orderBy: { orderIndex: 'asc' },
              include: {
                children: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
        roleNavGroups: role
          ? {
            where: { role },
          }
          : undefined,
        userRoleNavGroups: userId
          ? {
            where: { userId, visible: true },
          }
          : undefined,
      },
    })

    // 如果有角色或用户ID限制，过滤可见的导航组
    const filteredNavGroups = navGroups.filter((group) => {
      if (role && group.roleNavGroups.length === 0 && userId && group.userRoleNavGroups.length === 0) {
        return false
      }
      return true
    })

    // 转换为前端需要的格式
    const adaptedGroups = mapNavGroupsToFrontend(filteredNavGroups)

    // 获取用户数据
    const user = userId
      ? await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true },
      })
      : null

    // 创建空的侧边栏数据
    const t = (key: string) => key // 占位翻译函数
    const defaultData = createSidebarData(t)

    // 返回结果
    return {
      user: user
        ? {
          name: user.name,
          email: user.email,
          avatar: user.image || '/avatars/shadcn.jpg',
        }
        : defaultData.user,
      teams: defaultData.teams, // 团队暂时使用默认数据
      navGroups: adaptedGroups,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    // 发生错误时返回默认数据
    const t = (key: string) => key
    return createSidebarData(t)
  }
}

// 初始化数据库中的侧边栏数据
export async function initSidebarData() {
  const count = await prisma.navGroup.count()
  if (count > 0) {
    console.log('Sidebar data already exists, skipping initialization')
    return
  }

  // 获取默认数据作为初始化数据源
  const t = (key: string) => key
  const defaultData = createSidebarData(t)

  try {
    // 事务中处理所有创建操作
    await prisma.$transaction(async (tx) => {
      // 为每个导航组创建数据
      for (let i = 0; i < defaultData.navGroups.length; i++) {
        const group = defaultData.navGroups[i]
        const createdGroup = await tx.navGroup.create({
          data: {
            title: group.title,
            orderIndex: i,
            // 创建角色关联 - 默认为所有人可见
            roleNavGroups: {
              create: [{ role: 'user' }, { role: 'admin' }],
            },
          },
        })

        // 为每个分组下的项目创建数据
        for (let j = 0; j < group.items.length; j++) {
          const item = group.items[j]
          await createNavItem(tx, item, j, createdGroup.id)
        }
      }
    })

    console.log('Sidebar data initialized successfully')
  } catch (error) {
    console.error('Error initializing sidebar data:', error)
    throw error
  }
}

// 递归创建导航项及其子项
async function createNavItem(tx: PrismaClient, item: any, orderIndex: number, navGroupId: string, parentId?: string) {
  // 确定是否为可折叠菜单
  const isCollapsible = !!item.items && item.items.length > 0

  // 创建导航项
  const navItem = await tx.navItem.create({
    data: {
      title: item.title,
      url: !isCollapsible ? String(item.url || '') : null, // 如果是可折叠菜单，URL为null
      icon: item.icon ? (typeof item.icon === 'string' ? item.icon : 'IconPackages') : null, // 简化处理为字符串
      badge: item.badge,
      orderIndex,
      isCollapsible,
      navGroupId,
      parentId,
    },
  })

  // 如果有子项，递归创建子项
  if (isCollapsible && item.items) {
    for (let i = 0; i < item.items.length; i++) {
      await createNavItem(tx, item.items[i], i, navGroupId, navItem.id)
    }
  }

  return navItem
}

// 将数据库模型转换为前端需要的格式
function mapNavGroupsToFrontend(dbGroups: any[]): NavGroup[] {
  return dbGroups.map((group) => ({
    title: group.title,
    items: mapNavItemsToFrontend(group.navItems),
  }))
}

// 递归转换导航项
function mapNavItemsToFrontend(dbItems: any[]): NavItem[] {
  return dbItems.map((item) => {
    // 基础项目信息
    const baseItem = {
      title: item.title,
      badge: item.badge,
      icon: item.icon, // 前端组件需要处理图标名称转换为组件
    }

    // 如果是可折叠菜单，添加子项
    if (item.isCollapsible) {
      return {
        ...baseItem,
        items: mapNavItemsToFrontend(item.children),
      }
    }

    // 否则是普通链接
    return {
      ...baseItem,
      url: item.url,
    }
  })
}
