import type { NavGroup as NavGroupType, NavItem, NavLink } from '~/components/layout/types'

type SidebarScope = 'APP' | 'ADMIN'

function isNavLink(item: NavItem): item is NavLink {
  return 'url' in item
}

function findItemUrl(item: NavItem): string | null {
  return isNavLink(item) ? (item.url ?? null) : null
}

function hasNavItemUrl(items: NavItem[], url: string): boolean {
  return items.some((item) => {
    const itemUrl = findItemUrl(item)
    if (itemUrl === url) return true
    if ('items' in item) return item.items?.some((child) => findItemUrl(child) === url) ?? false
    return false
  })
}

export function mergeRequiredAdminGroups(
  groups: NavGroupType[],
  fallbackGroups: NavGroupType[],
  scope: SidebarScope
): NavGroupType[] {
  if (scope !== 'ADMIN') return groups

  const requiredGroup = fallbackGroups.find((group) => group.title === '运维与审计')
  if (!requiredGroup) return groups

  const existingIndex = groups.findIndex((group) => group.title === requiredGroup.title || group.title === '诊断')
  const missingItems = requiredGroup.items.filter((item) => {
    const url = findItemUrl(item)
    return url ? !groups.some((group) => hasNavItemUrl(group.items, url)) : false
  })
  if (missingItems.length === 0) return groups
  if (existingIndex === -1) return [...groups, { ...requiredGroup, items: missingItems }]

  return groups.map((group, index) => {
    if (index !== existingIndex) return group

    return {
      ...group,
      items: [...group.items, ...missingItems],
    }
  })
}
