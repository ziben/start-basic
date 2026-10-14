import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { adminNavigationGroups } from './admin-navigation'

describe('admin navigation', () => {
  it('only links to registered routes and uses each target once', () => {
    const routes = readFileSync('src/routeTree.gen.ts', 'utf8')
    const urls = adminNavigationGroups.flatMap((group) => group.items.map((item) => item.url))
    expect(new Set(urls).size).toBe(urls.length)
    for (const url of urls) {
      expect(routes).toContain(`'${url}':`)
    }
  })

  it('includes the existing health pages without exposing detail or placeholder routes', () => {
    expect(adminNavigationGroups.find((group) => group.title === '健康管理')?.items.map((item) => item.url)).toEqual([
      '/health/reports',
      '/health/persons',
      '/health/compare',
    ])
    const urls = adminNavigationGroups.flatMap((group) => group.items.map((item) => item.url))
    expect(urls).not.toContain('/admin/verification')
    expect(urls).not.toContain('/admin/invitations')
    expect(urls).not.toContain('/admin/userrolenavgroup')
  })
})
