import type { Tab } from '@/shared/types/tab-types'
import { describe, expect, it } from 'vitest'
import { dedupeTabs, getTitleForPath, normalizeTabPath } from './tab-utils'

describe('tab utils', () => {
  it('normalizes admin root and settings children to stable tab paths', () => {
    expect(normalizeTabPath('/admin')).toBe('/admin/dashboard')
    expect(normalizeTabPath('/admin/profile/settings/appearance')).toBe('/admin/profile/settings')
  })

  it('dedupes restored tabs by scope and normalized path', () => {
    const tabs: Tab[] = [
      {
        id: 'admin-dashboard',
        title: '系统概览',
        path: '/admin/dashboard',
        order: -1,
        closable: false,
        sortable: false,
        scope: 'ADMIN',
      },
      {
        id: 'old-modules',
        title: 'Modules',
        path: '/admin/modules',
        order: 1,
        closable: true,
        sortable: true,
        scope: 'ADMIN',
      },
      {
        id: 'new-modules',
        title: '模块诊断',
        path: '/admin/modules',
        order: 2,
        closable: true,
        sortable: true,
        scope: 'ADMIN',
      },
      {
        id: 'settings-child',
        title: '外观设置',
        path: '/admin/profile/settings/appearance',
        order: 3,
        closable: true,
        sortable: true,
        scope: 'ADMIN',
      },
      {
        id: 'settings-root',
        title: '账号设置',
        path: '/admin/profile/settings',
        order: 4,
        closable: true,
        sortable: true,
        scope: 'ADMIN',
      },
    ]

    expect(dedupeTabs(tabs).map((tab) => [tab.id, tab.path])).toEqual([
      ['admin-dashboard', '/admin/dashboard'],
      ['old-modules', '/admin/modules'],
      ['settings-child', '/admin/profile/settings'],
    ])
  })

  it('keeps protected tabs when duplicate paths exist', () => {
    const tabs: Tab[] = [
      {
        id: 'closable-dashboard',
        title: 'Dashboard',
        path: '/admin',
        order: 1,
        closable: true,
        sortable: true,
        scope: 'ADMIN',
      },
      {
        id: 'protected-dashboard',
        title: '系统概览',
        path: '/admin/dashboard',
        order: -1,
        closable: false,
        sortable: false,
        scope: 'ADMIN',
      },
    ]

    expect(dedupeTabs(tabs)).toEqual([
      {
        id: 'protected-dashboard',
        title: '系统概览',
        path: '/admin/dashboard',
        order: -1,
        closable: false,
        sortable: false,
        scope: 'ADMIN',
      },
    ])
  })

  it('returns stable Chinese titles for known admin routes', () => {
    expect(
      ['/admin/system-config', '/admin/users', '/admin/rbac/roles', '/admin/modules', '/admin/log'].map((path) => [
        path,
        getTitleForPath(path),
      ])
    ).toEqual([
      ['/admin/system-config', '系统设置'],
      ['/admin/users', '用户管理'],
      ['/admin/rbac/roles', '系统角色'],
      ['/admin/modules', '模块诊断'],
      ['/admin/log', '系统日志'],
    ])
  })
})
