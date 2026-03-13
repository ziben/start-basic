import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { permissionsQueryKeys } from '@/shared/lib/query-keys'
import {
  useAnyPermission,
  useAllPermissions,
  usePermission,
  usePermissions,
  usePermissionsMap,
  useIsAdmin,
} from '@/shared/hooks/use-permissions'

const getUserPermissionsMock = vi.fn()
const checkPermissionMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('~/modules/auth/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/shared/server-fns/permissions.fn', () => ({
  getUserPermissionsFn: (...args: unknown[]) => getUserPermissionsMock(...args),
  checkPermissionFn: (...args: unknown[]) => checkPermissionMock(...args),
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
  getUserPermissionsMock.mockResolvedValue(['user:read', 'user:update'])
  checkPermissionMock.mockResolvedValue(true)
})

describe('use-permissions hooks', () => {
  it('usePermissions returns permission list', async () => {
    const client = createClient()
    const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toEqual(['user:read', 'user:update'])
    })
  })

  it('usePermission returns single permission result', async () => {
    const client = createClient()
    const { result } = renderHook(() => usePermission('user:read'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.data).toBe(true)
    })
  })

  it('usePermissionsMap returns map', async () => {
    const client = createClient()
    const { result } = renderHook(() => usePermissionsMap(['user:read', 'user:delete']), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.map).toEqual({ 'user:read': true, 'user:delete': false })
    })
  })

  it('useAnyPermission uses permissions list', async () => {
    const client = createClient()
    const { result } = renderHook(() => useAnyPermission(['user:read', 'user:delete']), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true)
    })
  })

  it('useAllPermissions uses permissions list', async () => {
    const client = createClient()
    const { result } = renderHook(() => useAllPermissions(['user:read', 'user:delete']), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false)
    })
  })

  it('uses shared query keys', async () => {
    const client = createClient()
    renderHook(() => usePermissions(), { wrapper: createWrapper(client) })

    await waitFor(() => {
      const queryState = client.getQueryState(permissionsQueryKeys.list('user-1', undefined))
      expect(queryState?.status).toBe('success')
    })
  })

  it('does not query when unauthenticated', async () => {
    useAuthMock.mockReturnValue({ data: null })
    const client = createClient()
    const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(getUserPermissionsMock).not.toHaveBeenCalled()
  })

  it('returns empty map when permissions list is empty', async () => {
    getUserPermissionsMock.mockResolvedValue([])
    const client = createClient()
    const { result } = renderHook(() => usePermissionsMap([]), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.map).toEqual({})
    })
  })

  it('handles empty permission list for any/all', async () => {
    const client = createClient()
    const { result: anyResult } = renderHook(() => useAnyPermission([]), { wrapper: createWrapper(client) })
    const { result: allResult } = renderHook(() => useAllPermissions([]), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(anyResult.current.hasPermission).toBe(false)
      expect(allResult.current.hasPermission).toBe(true)
    })
  })

  it('does not query single permission when permission is empty', async () => {
    const client = createClient()
    const { result } = renderHook(() => usePermission(''), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(checkPermissionMock).not.toHaveBeenCalled()
  })

  it('useIsAdmin reflects admin roles and unauthenticated state', async () => {
    const client = createClient()

    useAuthMock.mockReturnValue({ data: { user: { id: 'user-1', role: 'admin' } } })
    const { result: adminResult } = renderHook(() => useIsAdmin(), { wrapper: createWrapper(client) })
    expect(adminResult.current.isAdmin).toBe(true)
    expect(adminResult.current.isSuperAdmin).toBe(false)

    useAuthMock.mockReturnValue({ data: { user: { id: 'user-1', role: 'superadmin' } } })
    const { result: superAdminResult } = renderHook(() => useIsAdmin(), { wrapper: createWrapper(client) })
    expect(superAdminResult.current.isAdmin).toBe(true)
    expect(superAdminResult.current.isSuperAdmin).toBe(true)

    useAuthMock.mockReturnValue({ data: null })
    const { result: anonResult } = renderHook(() => useIsAdmin(), { wrapper: createWrapper(client) })
    expect(anonResult.current.isAdmin).toBe(false)
    expect(anonResult.current.isSuperAdmin).toBe(false)
  })

  it('usePermissions exposes error when server fn fails', async () => {
    getUserPermissionsMock.mockRejectedValueOnce(new Error('boom'))
    const client = createClient()
    const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('usePermission exposes error when server fn fails', async () => {
    checkPermissionMock.mockRejectedValueOnce(new Error('boom'))
    const client = createClient()
    const { result } = renderHook(() => usePermission('user:read'), { wrapper: createWrapper(client) })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
