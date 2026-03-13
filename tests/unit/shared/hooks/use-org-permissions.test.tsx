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
const hasOrgPermissionMock = vi.fn()
const getOrgRoleMock = vi.fn()

vi.mock('~/modules/auth/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/shared/server-fns/org-permissions.fn', () => ({
  checkOrgPermissionFn: (...args: unknown[]) => hasOrgPermissionMock(...args),
  getOrgRoleFn: (...args: unknown[]) => getOrgRoleMock(...args),
}))

const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

const createClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
  useAuthMock.mockReturnValue({ data: { user: { id: 'user-1' } } })
  hasOrgPermissionMock.mockResolvedValue(true)
  getOrgRoleMock.mockResolvedValue('admin')
})

describe('use-org-permissions hooks', () => {
  it('useOrgPermission returns permission result', async () => {
    const client = createClient()
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
    const client = createClient()
    const { result } = renderHook(() => useOrgPermission('org-1', 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(hasOrgPermissionMock).not.toHaveBeenCalled()
  })

  it('does not query when organizationId is missing', async () => {
    const client = createClient()
    const { result } = renderHook(() => useOrgPermission(undefined, 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(hasOrgPermissionMock).not.toHaveBeenCalled()
  })

  it('returns role from useOrgRole', async () => {
    const client = createClient()
    const { result } = renderHook(() => useOrgRole('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toBe('admin')
    })
  })

  it('useIsOrgOwner/useIsOrgAdmin reflect role', async () => {
    getOrgRoleMock.mockResolvedValue('owner')
    const client = createClient()

    const { result: ownerResult } = renderHook(() => useIsOrgOwner('org-1'), { wrapper: createWrapper(client) })
    const { result: adminResult } = renderHook(() => useIsOrgAdmin('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(ownerResult.current.isOwner).toBe(true)
      expect(adminResult.current.isOrgAdmin).toBe(true)
    })
  })

  it('handles empty permission list for any/all', async () => {
    const client = createClient()
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
    const client = createClient()
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
    const client = createClient()
    const { result } = renderHook(() => useOrgPermission('org-1', 'user', 'read'), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('exposes error when org role server fn fails', async () => {
    getOrgRoleMock.mockRejectedValueOnce(new Error('boom'))
    const client = createClient()
    const { result } = renderHook(() => useOrgRole('org-1'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
