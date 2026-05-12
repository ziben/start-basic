import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { createAdminSidebarData, createSidebarData } from '~/components/layout/data/sidebar-data'
import type { NavGroup, NavItem, SidebarData } from '~/components/layout/types'

type SidebarScope = 'APP' | 'ADMIN'
type SerializedNavLink = {
  title: string
  url: string
  badge?: string
  icon?: string
}
type SerializedNavCollapsible = {
  title: string
  badge?: string
  icon?: string
  items: SerializedNavLink[]
}
type SerializedNavItem = SerializedNavLink | SerializedNavCollapsible
type SerializedSidebarData = Omit<SidebarData, 'teams' | 'navGroups'> & {
  teams: Array<Omit<SidebarData['teams'][number], 'logo'> & { logo: string }>
  navGroups: Array<Omit<NavGroup, 'items'> & { items: SerializedNavItem[] }>
}

function serializeIcon(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'function') {
    const fn = value as { displayName?: string; name?: string }
    return fn.displayName || fn.name || ''
  }
  if (value && typeof value === 'object' && ('displayName' in value || 'name' in value)) {
    const obj = value as { displayName?: string; name?: string }
    return obj.displayName || obj.name || ''
  }
  return String(value)
}

function serializeNavItems(items: NavItem[]): SerializedNavItem[] {
  return items.map((item) => {
    if ('items' in item && item.items) {
      return {
        title: item.title,
        badge: item.badge,
        icon: serializeIcon(item.icon),
        items: item.items.map((child) => ({
          title: child.title,
          url: String(child.url || ''),
          badge: child.badge,
          icon: serializeIcon(child.icon),
        })),
      }
    }

    return {
      title: item.title,
      url: String(item.url || ''),
      badge: item.badge,
      icon: serializeIcon(item.icon),
    }
  })
}

function serializeSidebarData(data: SidebarData): SerializedSidebarData {
  return {
    ...data,
    teams: data.teams.map((team) => ({
      ...team,
      logo: serializeIcon(team.logo),
    })),
    navGroups: data.navGroups.map((group) => ({
      ...group,
      items: serializeNavItems(group.items),
    })),
  }
}

function createFallbackSidebarData(scope: SidebarScope): SerializedSidebarData {
  const t = (key: string): string => key
  return serializeSidebarData(scope === 'ADMIN' ? createAdminSidebarData(t) : createSidebarData(t))
}

export async function loadSidebarData(scope: SidebarScope): Promise<SerializedSidebarData> {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { auth } = await import('../../../auth/shared/lib/auth')
  const { getSidebarData } = await import('./server-utils')

  try {
    const { headers } = getRequest()!
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id
    const role = session?.user?.role || 'public'

    return serializeSidebarData(await getSidebarData(userId, role, scope))
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    return createFallbackSidebarData(scope)
  }
}

export const getSidebarDataFn = createServerFn({ method: 'GET' })
  .inputValidator(z.enum(['APP', 'ADMIN']).optional())
  .handler(async ({ data }): Promise<SerializedSidebarData> => {
    const scope: SidebarScope = data === 'ADMIN' ? 'ADMIN' : 'APP'
    return loadSidebarData(scope)
  })
