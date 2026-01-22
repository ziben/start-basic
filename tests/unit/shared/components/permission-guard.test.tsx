import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PermissionGuard } from '@/shared/components/permission-guard'

const usePermissionsMapMock = vi.fn()
const useIsAdminMock = vi.fn()

vi.mock('@/shared/hooks/use-permissions', () => ({
  usePermissionsMap: (...args: unknown[]) => usePermissionsMapMock(...args),
  useIsAdmin: () => useIsAdminMock(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  usePermissionsMapMock.mockReturnValue({ map: {}, isLoading: false })
  useIsAdminMock.mockReturnValue({ isAdmin: false, isSuperAdmin: false })
})

describe('PermissionGuard', () => {
  it('renders children when permission is granted', () => {
    usePermissionsMapMock.mockReturnValue({ map: { 'user:read': true }, isLoading: false })

    render(
      <PermissionGuard permission="user:read">
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Allowed')).toBeInTheDocument()
  })

  it('renders fallback when permission is denied', () => {
    usePermissionsMapMock.mockReturnValue({ map: { 'user:read': false }, isLoading: false })

    render(
      <PermissionGuard permission="user:read" fallback={<div>Denied</div>}>
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Denied')).toBeInTheDocument()
  })

  it('renders loadingFallback when loading', () => {
    usePermissionsMapMock.mockReturnValue({ map: {}, isLoading: true })

    render(
      <PermissionGuard permission="user:read" loadingFallback={<div>Loading</div>}>
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders loadingFallback function when loading', () => {
    usePermissionsMapMock.mockReturnValue({ map: {}, isLoading: true })

    render(
      <PermissionGuard
        permission="user:read"
        loadingFallback={({ isLoading }) => <div>{isLoading ? 'LoadingFn' : 'Idle'}</div>}
      >
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('LoadingFn')).toBeInTheDocument()
  })

  it('supports anyPermissions', () => {
    usePermissionsMapMock.mockReturnValue({ map: { 'user:read': false, 'user:write': true }, isLoading: false })

    render(
      <PermissionGuard anyPermissions={['user:read', 'user:write']}>
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Allowed')).toBeInTheDocument()
  })

  it('supports allPermissions', () => {
    usePermissionsMapMock.mockReturnValue({ map: { 'user:read': true, 'user:write': false }, isLoading: false })

    render(
      <PermissionGuard allPermissions={['user:read', 'user:write']} fallback={<div>Denied</div>}>
        <div>Allowed</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Denied')).toBeInTheDocument()
  })

  it('supports requireAdmin', () => {
    useIsAdminMock.mockReturnValue({ isAdmin: true, isSuperAdmin: false })

    render(
      <PermissionGuard requireAdmin>
        <div>AdminOnly</div>
      </PermissionGuard>
    )

    expect(screen.getByText('AdminOnly')).toBeInTheDocument()
  })

  it('renders children when no permissions are specified', () => {
    render(
      <PermissionGuard>
        <div>Default</div>
      </PermissionGuard>
    )

    expect(screen.getByText('Default')).toBeInTheDocument()
  })
})
