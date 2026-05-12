import type { ElementType } from 'react'
import prisma from '@/shared/lib/db'
import { createAdminSidebarData, createSidebarData } from '~/components/layout/data/sidebar-data'
import type { SidebarData, NavGroup as NavGroupType, NavItem, NavCollapsible, NavLink } from '~/components/layout/types'
import { mergeRequiredAdminGroups } from './required-groups'

type SidebarScope = 'APP' | 'ADMIN'

type DbNavItem = {
  title: string
  url?: string | null
  icon?: string | null
  badge?: string | null
  isCollapsible?: boolean
  children?: DbNavItem[]
}

type DbNavGroup = {
  title: string
  navItems?: DbNavItem[]
}

type SerializableNavItem = NavItem & {
  icon?: string | ElementType
}

function isNavLink(item: NavItem): item is NavLink {
  return 'url' in item
}

function hasAdminUrl(item: NavItem): boolean {
  if (isNavLink(item)) return item.url?.includes('/admin') ?? false
  return item.items?.some(hasAdminUrl) ?? false
}

function serializeIcon(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'function') {
    const fn = val as { displayName?: string; name?: string }
    return fn.displayName || fn.name || ''
  }
  if (val && typeof val === 'object' && ('displayName' in val || 'name' in val)) {
    const obj = val as { displayName?: string; name?: string }
    return obj.displayName || obj.name || ''
  }
  return String(val || '')
}

function serializeNavItems(items: NavItem[]): NavItem[] {
  return (items || []).map((item) => {
    const serializable = item as SerializableNavItem
    const base = {
      ...item,
      icon: serializeIcon(serializable.icon),
    }

    if ('items' in item && item.items) {
      return {
        ...base,
        items: serializeNavItems(item.items),
      } as NavCollapsible
    }

    return base as NavLink
  })
}

// 从数据库获取侧边栏数据并转换为前端需要的格式
export async function getSidebarData(
  userId?: string,
  role?: string,
  scope: SidebarScope = 'APP'
): Promise<SidebarData> {
  try {
    // 获取菜单组
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
        roleNavGroups: true,
        userRoleNavGroups: userId
          ? {
              where: { userId, visible: true },
            }
          : undefined,
      },
    })

    // 获取当前用户的完整信息
    const currentUser = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
          },
        })
      : null

    // 如果有角色或用户ID限制，过滤可见的菜单组
    const filteredNavGroups = navGroups.filter((group) => {
      // 1. 检查用户个性化设置 (隐藏)
      if (userId && group.userRoleNavGroups && group.userRoleNavGroups.length > 0) {
        if (group.userRoleNavGroups.some((urg) => !urg.visible)) return false
      }

      // 2. 如果菜单组没有任何角色限制（或角色为空），则所有人可见
      const validRoleRestrictions = (group.roleNavGroups || []).map((rg) => rg.roleName).filter((r): r is string => !!r)

      if (validRoleRestrictions.length === 0) {
        return true
      }

      // 3. 检查角色匹配
      // 获取用户角色（支持多角色，逗号分隔）
      const userRoles = new Set<string>()
      if (currentUser?.role) {
        currentUser.role.split(',').forEach((r) => userRoles.add(r.trim()))
      }
      if (role) userRoles.add(role)

      return validRoleRestrictions.some((roleName) => userRoles.has(roleName))
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
    const t = (key: string): string => key // 占位翻译函数
    const defaultData = scope === 'ADMIN' ? createAdminSidebarData(t) : createSidebarData(t)

    // 获取动态 Teams (Organizations)
    const organizations = await prisma.organization.findMany({
      where: userId
        ? {
            members: {
              some: { userId },
            },
          }
        : {},
      take: 10,
    })

    const serializedTeams =
      organizations.length > 0
        ? organizations.map((org) => ({
            name: org.name,
            logo: org.logo || 'IconCommand', // 默认图标
            plan: org.slug || 'Free',
          }))
        : (defaultData.teams || []).map((team) => ({
            ...team,
            logo: serializeIcon(team.logo),
          }))

    const serializedNavGroups = (defaultData.navGroups || [])
      .filter((group): boolean => {
        if (scope !== 'APP') return true

        return !group.items.some(hasAdminUrl)
      })
      .map((group): NavGroupType => {
        return {
          ...group,
          items: serializeNavItems(group.items || []),
        }
      })

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
      navGroups:
        adaptedGroups.length > 0
          ? mergeRequiredAdminGroups(adaptedGroups, serializedNavGroups, scope)
          : serializedNavGroups,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    // 发生错误时返回默认数据
    const t = (key: string): string => key
    return scope === 'ADMIN' ? createAdminSidebarData(t) : createSidebarData(t)
  }
}

// 将数据库模型转换为前端需要的格式
function mapNavGroupsToFrontend(dbGroups: DbNavGroup[]): NavGroupType[] {
  return dbGroups.map((group) => ({
    title: group.title,
    items: mapNavItemsToFrontend(group.navItems || []),
  }))
}

// 递归转换导航项
function mapNavItemsToFrontend(dbItems: DbNavItem[]): NavItem[] {
  return (dbItems || []).map((item) => {
    // 基础项目信息
    const baseItem = {
      title: item.title,
      badge: item.badge ?? undefined,
      icon: item.icon ?? undefined,
    }

    // 如果是可折叠菜单，添加子项
    if (item?.isCollapsible) {
      return {
        ...baseItem,
        items: mapNavItemsToFrontend(item.children || []),
      } as NavCollapsible
    }

    // 否则是普通链接
    return {
      ...baseItem,
      url: item.url || '',
    } as NavLink
  })
}

// 初始化数据库中的侧边栏数据
export async function initSidebarData(): Promise<void> {
  const count = await prisma.navGroup.count()
  if (count > 0) {
    await ensureAdminDiagnosticsNavGroup()
    console.log('Sidebar data already exists, skipping initialization')
    return
  }

  // 获取默认数据作为初始化数据源
  const t = (key: string): string => key
  const sidebarSeeds: Array<{ scope: SidebarScope; data: SidebarData }> = [
    { scope: 'APP', data: createSidebarData(t) },
    { scope: 'ADMIN', data: createAdminSidebarData(t) },
  ]

  try {
    // 事务中处理所有创建操作
    await prisma.$transaction(async (tx): Promise<void> => {
      // 为每个菜单组创建数据
      for (const seed of sidebarSeeds) {
        for (let i = 0; i < seed.data.navGroups.length; i++) {
          const group = seed.data.navGroups[i]
          const createdGroup = await tx.navGroup.create({
            data: {
              title: group.title,
              scope: seed.scope,
              orderIndex: i,
            },
          })

          // 为每个分组下的项目创建数据
          for (let j = 0; j < group.items.length; j++) {
            const item = group.items[j]
            await createNavItem(tx, item, j, createdGroup.id)
          }
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
async function createNavItem(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  item: NavItem,
  orderIndex: number,
  navGroupId: string,
  parentId?: string
): Promise<unknown> {
  // 确定是否为可折叠菜单
  const isCollapsible = 'items' in item && !!item.items && item.items.length > 0

  // 创建导航项
  const navItem = await tx.navItem.create({
    data: {
      title: item.title,
      url: !isCollapsible ? String((item as NavLink).url || '') : null,
      icon: item.icon ? serializeIcon(item.icon) : null,
      badge: item.badge,
      orderIndex,
      isCollapsible,
      navGroupId,
      parentId,
    },
  })

  // 如果有子项，递归创建子项
  if (isCollapsible && 'items' in item && item.items) {
    for (let i = 0; i < item.items.length; i++) {
      await createNavItem(tx, item.items[i], i, navGroupId, navItem.id)
    }
  }

  return navItem
}

async function ensureAdminDiagnosticsNavGroup(): Promise<void> {
  const t = (key: string): string => key
  const diagnosticsGroup = createAdminSidebarData(t).navGroups.find((group) => group.title === '诊断')
  if (!diagnosticsGroup) return

  await prisma.$transaction(async (tx): Promise<void> => {
    const existingGroup = await tx.navGroup.findFirst({
      where: {
        scope: 'ADMIN',
        title: diagnosticsGroup.title,
      },
      include: {
        navItems: true,
      },
    })

    const navGroup =
      existingGroup ??
      (await tx.navGroup.create({
        data: {
          title: diagnosticsGroup.title,
          scope: 'ADMIN',
          orderIndex: await tx.navGroup.count({ where: { scope: 'ADMIN' } }),
        },
        include: {
          navItems: true,
        },
      }))

    for (let i = 0; i < diagnosticsGroup.items.length; i++) {
      const item = diagnosticsGroup.items[i]
      if (!isNavLink(item)) continue

      const exists = navGroup.navItems.some((navItem) => navItem.url === item.url)
      if (exists) continue

      await createNavItem(tx, item, navGroup.navItems.length + i, navGroup.id)
    }
  })
}
