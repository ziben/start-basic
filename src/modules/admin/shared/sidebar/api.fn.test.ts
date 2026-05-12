import { describe, expect, it, vi } from 'vitest'
import { loadSidebarData } from './api.fn'

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => ({
    headers: new Headers(),
  }),
}))

vi.mock('../../../auth/shared/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => {
        throw new Error('session unavailable')
      }),
    },
  },
}))

vi.mock('./server-utils', () => ({
  getSidebarData: vi.fn(async () => {
    throw new Error('database unavailable')
  }),
}))

describe('getSidebarDataFn', () => {
  it('returns admin fallback data instead of undefined when sidebar loading fails', async () => {
    const data = await loadSidebarData('ADMIN')

    expect(data.navGroups.some((group) => group.title === '诊断')).toBe(true)
    expect(
      data.navGroups.flatMap((group) => group.items).some((item) => 'url' in item && item.url === '/admin/modules')
    ).toBe(true)
    expect(
      data.navGroups.flatMap((group) => group.items).some((item) => 'url' in item && item.url === '/admin/log')
    ).toBe(true)
  })
})
