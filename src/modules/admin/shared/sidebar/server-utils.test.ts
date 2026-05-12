import { describe, expect, it } from 'vitest'
import { createAdminSidebarData } from '~/components/layout/data/sidebar-data'
import type { NavGroup } from '~/components/layout/types'
import { mergeRequiredAdminGroups } from './required-groups'

describe('sidebar server utils', () => {
  it('keeps core admin navigation targets available from fallback data', () => {
    const fallbackGroups = createAdminSidebarData((key) => key).navGroups
    const links = fallbackGroups.flatMap((group) => group.items).filter((item) => 'url' in item)

    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: '系统设置', url: '/admin/system-config' }),
        expect.objectContaining({ title: '用户管理', url: '/admin/users' }),
        expect.objectContaining({ title: '系统角色', url: '/admin/rbac/roles' }),
        expect.objectContaining({ title: '模块诊断', url: '/admin/modules' }),
        expect.objectContaining({ title: '日志', url: '/admin/log' }),
      ])
    )
  })

  it('adds diagnostics links to existing admin sidebar groups', () => {
    const groups: NavGroup[] = [
      {
        title: '系统管理',
        items: [
          {
            title: '系统设置',
            url: '/admin/system-config',
          },
        ],
      },
    ]

    const merged = mergeRequiredAdminGroups(groups, createAdminSidebarData((key) => key).navGroups, 'ADMIN')

    expect(merged).toEqual([
      groups[0],
      expect.objectContaining({
        title: '诊断',
        items: expect.arrayContaining([
          expect.objectContaining({ title: '模块诊断', url: '/admin/modules' }),
          expect.objectContaining({ title: '日志', url: '/admin/log' }),
        ]),
      }),
    ])
  })

  it('does not duplicate diagnostics links when the dynamic sidebar already has them', () => {
    const groups: NavGroup[] = [
      {
        title: '诊断',
        items: [
          {
            title: '模块诊断',
            url: '/admin/modules',
          },
        ],
      },
    ]

    const merged = mergeRequiredAdminGroups(groups, createAdminSidebarData((key) => key).navGroups, 'ADMIN')
    const diagnostics = merged.find((group) => group.title === '诊断')

    expect(diagnostics?.items.filter((item) => 'url' in item && item.url === '/admin/modules')).toHaveLength(1)
    expect(diagnostics?.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: '日志', url: '/admin/log' })])
    )
  })

  it('does not add admin diagnostics links to app scope groups', () => {
    const groups: NavGroup[] = [
      {
        title: '概览',
        items: [
          {
            title: '控制台',
            url: '/dashboard',
          },
        ],
      },
    ]

    expect(mergeRequiredAdminGroups(groups, createAdminSidebarData((key) => key).navGroups, 'APP')).toBe(groups)
  })
})
