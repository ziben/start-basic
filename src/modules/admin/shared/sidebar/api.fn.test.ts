import { describe, expect, it, vi } from 'vitest'
import { loadSidebarData } from './sidebar-data-loader'

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
  it('returns app fallback data when sidebar loading fails', async () => {
    const data = await loadSidebarData('APP')

    expect(data.navGroups.length).toBeGreaterThan(0)
  })

})
