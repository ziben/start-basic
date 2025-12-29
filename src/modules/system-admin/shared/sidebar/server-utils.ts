import { createSidebarData } from '~/components/layout/data/sidebar-data'
import type { SidebarData, NavGroup as NavGroupType, NavItem } from '~/components/layout/types'
import prisma from '@/shared/lib/db'

// 从数据库获取侧边栏数据并转换为前端需要的格式
export async function getSidebarData(
  userId?: string,
  role?: string,
  scope: 'APP' | 'ADMIN' = 'APP'
): Promise<SidebarData> {
  try {
    // 获取导航组
    const navGroups = await prisma.navGroup.findMany({
      where: { scope },
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
    const filteredNavGroups = navGroups.filter((group: any) => {
      if (role && group.roleNavGroups.length === 0 && userId && group.userRoleNavGroups.length === 0) {
        return false
      }
      return true
    })

    // 转换为前端需要的格式
    const adaptedGroups = mapNavGroupsToFrontend(filteredNavGroups as any)

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

    // 为避免将 React 组件/函数（可能包含 Symbol）序列化到响应中，
    // 我们在服务器端将 logo/icon 等非可序列化值转换为字符串标识。
    const serializeIcon = (val: any) => {
      if (!val) return null
      if (typeof val === 'string') return val
      // lucide-react 的组件通常有 name 属性；尝试使用它
      if (val && (val.displayName || val.name)) return val.displayName || val.name
      try {
        return String(val)
      } catch (e) {
        return null
      }
    }

    const serializedTeams = (defaultData.teams || []).map((team) => ({
      ...team,
      logo: serializeIcon(team.logo),
    }))

    const serializedNavGroups = (defaultData.navGroups || []).map((group) => ({
      ...group,
      items: (group.items || []).map((it: any) => ({
        ...it,
        icon: serializeIcon(it.icon),
      })),
    }))

    // 返回结果（前端会根据字符串标识再用 iconResolver 解析回组件）
    return {
      user: user
        ? {
            name: user.name,
            email: user.email,
            avatar: user.image || '/avatars/shadcn.jpg',
          }
        : defaultData.user,
      teams: serializedTeams,
      navGroups: adaptedGroups.length > 0 ? adaptedGroups : serializedNavGroups,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    // 发生错误时返回默认数据
    const t = (key: string) => key
    return createSidebarData(t)
  }
}

// 将数据库模型转换为前端需要的格式
function mapNavGroupsToFrontend(dbGroups: any[]): NavGroupType[] {
  return dbGroups.map((group: any) => ({
    title: group.title,
    items: mapNavItemsToFrontend(group.navItems),
  })) as NavGroupType[]
}

// 递归转换导航项
function mapNavItemsToFrontend(dbItems: any[]): NavItem[] {
  return (dbItems || []).map((item: any) => {
    // 基础项目信息
    const baseItem = {
      title: item.title,
      badge: item.badge,
      icon: item.icon, // 前端组件需要处理图标名称转换为组件
    }

    // 如果是可折叠菜单，添加子项
    if (item?.isCollapsible) {
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
  }) as NavItem[]
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
      const client = tx as any
      // 为每个导航组创建数据
      for (let i = 0; i < defaultData.navGroups.length; i++) {
        const group = defaultData.navGroups[i]
        const createdGroup = await client.navGroup.create({
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
          await createNavItem(client, item, j, createdGroup.id)
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
async function createNavItem(tx: any, item: any, orderIndex: number, navGroupId: string, parentId?: string) {
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





