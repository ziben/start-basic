import type { Prisma } from '~/generated/prisma/client'
import { adminNavigationGroups } from './admin-navigation'

const legacyGroupTitles: Record<string, string[]> = {
  概览: ['仪表盘'],
  系统配置: ['配置'],
  用户与权限: ['系统管理', '身份与组织'],
  运维与审计: ['诊断'],
}

const legacyUrls: Record<string, string[]> = {
  '/admin/account': ['/admin/accounts'],
  '/admin/session': ['/admin/sessions'],
}

export async function syncAdminNavigation(tx: Prisma.TransactionClient): Promise<void> {
  const groups = await tx.navGroup.findMany({
    where: { scope: 'ADMIN' },
    include: { navItems: true, roleNavGroups: true, userRoleNavGroups: true },
  })
  const source = groups.find((group) => ['用户与权限', '系统管理', '身份与组织'].includes(group.title))
  const adminRoles = await tx.role.findMany({ where: { name: { in: ['admin', 'superadmin'] } } })
  const roleNames = source?.roleNavGroups.length
    ? source.roleNavGroups.map((role) => role.roleName)
    : adminRoles.map((role) => role.name)
  if (roleNames.length === 0) throw new Error('Admin navigation requires existing administrator roles')

  const existingItems = groups.flatMap((group) => group.navItems)
  for (const [groupIndex, definition] of adminNavigationGroups.entries()) {
    const titles = [definition.title, ...(legacyGroupTitles[definition.title] ?? [])]
    const candidates = groups.filter((group) => titles.includes(group.title))
    if (candidates.length > 1) throw new Error(`Ambiguous navigation group: ${definition.title}`)
    const existingGroup = candidates[0]
    const group = existingGroup
      ? await tx.navGroup.update({
          where: { id: existingGroup.id },
          data: { title: definition.title, orderIndex: groupIndex },
        })
      : await tx.navGroup.create({
          data: {
            title: definition.title,
            scope: 'ADMIN',
            orderIndex: groupIndex,
            roleNavGroups: { create: roleNames.map((roleName) => ({ roleName })) },
            userRoleNavGroups: {
              create: (source?.userRoleNavGroups ?? []).map(({ userId, visible }) => ({ userId, visible })),
            },
          },
        })

    for (const [itemIndex, item] of definition.items.entries()) {
      if (!item.url) throw new Error(`Navigation item requires a URL: ${item.title}`)
      const urls = [item.url, ...(legacyUrls[item.url] ?? [])]
      const matches = existingItems.filter((entry) => entry.url && urls.includes(entry.url))
      if (matches.length > 1) throw new Error(`Duplicate navigation target: ${item.url}`)
      if (matches[0]?.parentId) throw new Error(`Cannot relocate a nested navigation item: ${item.url}`)

      const data = {
        title: item.title,
        url: item.url,
        icon: String(item.icon),
        navGroupId: group.id,
        orderIndex: itemIndex,
        isCollapsible: false,
      }
      if (matches[0]) {
        await tx.navItem.update({ where: { id: matches[0].id }, data })
      } else {
        await tx.navItem.create({ data })
      }
    }
  }
}
