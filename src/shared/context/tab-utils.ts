import type { Tab, TabScope } from '@/shared/types/tab-types'

export function normalizeTabPath(path: string): string {
  if (path === '/admin') return '/admin/dashboard'
  if (path.startsWith('/admin/profile/settings')) return '/admin/profile/settings'
  return path
}

export function getTabScope(path: string): TabScope {
  return path.startsWith('/admin') ? 'ADMIN' : 'APP'
}

export function dedupeTabs(tabs: Tab[]): Tab[] {
  const byScopeAndPath = new Map<string, Tab>()

  for (const tab of tabs) {
    const path = normalizeTabPath(tab.path)
    const scope = tab.scope ?? getTabScope(path)
    const key = `${scope}:${path}`
    const existing = byScopeAndPath.get(key)

    if (!existing || (existing.closable !== false && tab.closable === false)) {
      byScopeAndPath.set(key, { ...tab, path, scope })
    }
  }

  return Array.from(byScopeAndPath.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function getTitleForPath(path: string): string {
  const titleMap: Record<string, string> = {
    '/admin/dashboard': '系统概览',
    '/admin/modules': '模块诊断',
    '/admin/users': '用户管理',
    '/admin/rbac/roles': '系统角色',
    '/admin/rbac/org-roles': '组织角色',
    '/admin/rbac/permissions': '权限定义',
    '/admin/log': '系统日志',
    '/admin/profile/settings': '账号设置',
    '/admin/system-config': '系统设置',
    '/admin/ai-chat': 'AI',
    '/admin/navigation': '菜单管理',
    '/admin/translation': 'I18N管理',
    '/admin/organizations': '组织管理',
    '/admin/members': '成员管理',
    '/admin/department': '部门管理',
  }

  if (titleMap[path]) return titleMap[path]

  const segments = path.split('/').filter(Boolean)
  const lastSegment = segments.at(-1)

  if (lastSegment) {
    const segmentMap: Record<string, string> = {
      settings: '设置',
      profile: '个人资料',
      dashboard: '概览',
      users: '用户',
      roles: '角色',
      permissions: '权限',
      log: '日志',
      audit: '审计',
      account: '账户',
      security: '安全',
      identity: '身份认证',
      system: '系统',
    }

    if (segmentMap[lastSegment.toLowerCase()]) {
      return segmentMap[lastSegment.toLowerCase()]
    }

    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  return '详情页'
}
