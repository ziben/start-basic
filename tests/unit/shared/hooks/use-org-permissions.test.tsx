import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAllOrgPermissions,
  useAnyOrgPermission,
  useIsOrgAdmin,
  useIsOrgOwner,
  useOrgPermission,
  useOrgRole,
} from '@/shared/hooks/use-org-permissions'

const useAuthMock = vi.fn()
const getSessionMock = vi.fn()
const hasOrgPermissionMock = vi.fn()
const memberFindFirstMock = vi.fn()

vi.mock('~/modules/identity/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('~/modules/identity/shared/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      hasOrgPermission: (...args: unknown[]) => hasOrgPermissionMock(...args),
    },
  },
}))

vi.mock('@/shared/lib/db', () => ({
  default: {
    member: {
      findFirst: (...args: unknown[]) => memberFindFirstMock(...args),
    },
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => ({ headers: {} as Record<string, string> }),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const api = {
      inputValidator: () => api,
      handler: (handler: (payload: unknown) => unknown) => (payload: unknown) => handler(payload),
    }
    return api
  },
}))

const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  useAuthMock.mockReturnValue({ data: { user: { id: 'user-1' } } })
  getSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
  hasOrgPermissionMock.mockResolvedValue(true)
  memberFindFirstMock.mockResolvedValue({ role: 'admin' })
})

describe('use-org-permissions hooks', () => {
  it('useOrgPermission returns permission result', async () => {
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgPermission('org-1', 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.data).toBe(true)
    })

    expect(hasOrgPermissionMock).toHaveBeenCalled()
  })

  it('does not query when unauthenticated', async () => {
    useAuthMock.mockReturnValue({ data: null })
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgPermission('org-1', 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(hasOrgPermissionMock).not.toHaveBeenCalled()
  })

  it('does not query when organizationId is missing', async () => {
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgPermission(undefined, 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(hasOrgPermissionMock).not.toHaveBeenCalled()
  })

  it('returns role from useOrgRole', async () => {
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgRole('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toBe('admin')
    })
  })

  it('useIsOrgOwner/useIsOrgAdmin reflect role', async () => {
    memberFindFirstMock.mockResolvedValue({ role: 'owner' })
    const client = new QueryClient()

    const { result: ownerResult } = renderHook(() => useIsOrgOwner('org-1'), { wrapper: createWrapper(client) })
    const { result: adminResult } = renderHook(() => useIsOrgAdmin('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(ownerResult.current.isOwner).toBe(true)
      expect(adminResult.current.isOrgAdmin).toBe(true)
    })
  })

  it('handles empty permission list for any/all', async () => {
    const client = new QueryClient()
    const { result: anyResult } = renderHook(() => useAnyOrgPermission('org-1', []), {
      wrapper: createWrapper(client),
    })
    const { result: allResult } = renderHook(() => useAllOrgPermissions('org-1', []), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(anyResult.current.hasPermission).toBe(false)
      expect(allResult.current.hasPermission).toBe(true)
    })
  })

  it('does not query when resource or action is missing', async () => {
    const client = new QueryClient()
    const { result: emptyResource } = renderHook(() => useOrgPermission('org-1', '', 'read'), {
      wrapper: createWrapper(client),
    })
    const { result: emptyAction } = renderHook(() => useOrgPermission('org-1', 'user', ''), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(emptyResource.current.isFetching).toBe(false)
      expect(emptyAction.current.isFetching).toBe(false)
    })

    expect(hasOrgPermissionMock).not.toHaveBeenCalled()
  })

  it('exposes error when org permission server fn fails', async () => {
    hasOrgPermissionMock.mockRejectedValueOnce(new Error('boom'))
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgPermission('org-1', 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('exposes error when org role server fn fails', async () => {
    memberFindFirstMock.mockRejectedValueOnce(new Error('boom'))
    const client = new QueryClient()
    const { result } = renderHook(() => useOrgRole('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
