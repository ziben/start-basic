import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleAssignRoleNavGroups } from '~/modules/navigation/shared/navgroup/services/role-nav-groups.service'
import { handleAssignPermissions, handleUpdateRole } from '../services/role-assignment.service'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getRoleNameById: vi.fn(),
  clearAccessControlCache: vi.fn(),
  reinitAuth: vi.fn(),
  role: { findUnique: vi.fn(), update: vi.fn() },
  rolePermission: { deleteMany: vi.fn(), createMany: vi.fn() },
  roleNavGroup: { deleteMany: vi.fn(), createMany: vi.fn() },
  navGroup: { findMany: vi.fn() },
  transaction: vi.fn(),
}))

vi.mock('~/modules/admin/shared/server-fns/auth', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('~/modules/auth/shared/services/role.service', () => ({ getRoleNameById: mocks.getRoleNameById }))
vi.mock('~/modules/auth/shared/lib/auth', () => ({
  clearAccessControlCache: mocks.clearAccessControlCache,
  reinitAuth: mocks.reinitAuth,
}))
vi.mock('@/shared/lib/db', () => ({
  default: {
    $transaction: mocks.transaction,
    role: mocks.role,
    rolePermission: mocks.rolePermission,
    roleNavGroup: mocks.roleNavGroup,
    navGroup: mocks.navGroup,
  },
}))

let permissions: string[]
let groups: string[]
let displayName: string

beforeEach(() => {
  vi.resetAllMocks()
  permissions = ['old-permission']
  groups = ['old-group']
  displayName = 'Original'
  mocks.role.findUnique.mockResolvedValue({ id: 'role-1', isSystem: false })
  mocks.getRoleNameById.mockResolvedValue('GLOBAL:editor')
  mocks.navGroup.findMany.mockResolvedValue([{ id: 'new-group' }])
  mocks.role.update.mockImplementation(async ({ data }) => {
    displayName = data.displayName ?? displayName
    return { id: 'role-1', displayName }
  })
  mocks.rolePermission.deleteMany.mockImplementation(async () => {
    permissions = []
  })
  mocks.rolePermission.createMany.mockImplementation(async ({ data }) => {
    permissions = data.map((entry: { permissionId: string }) => entry.permissionId)
  })
  mocks.roleNavGroup.deleteMany.mockImplementation(async () => {
    groups = []
  })
  mocks.roleNavGroup.createMany.mockImplementation(async ({ data }) => {
    groups = data.map((entry: { navGroupId: string }) => entry.navGroupId)
  })
  mocks.transaction.mockImplementation(async (work) => {
    const snapshot = { permissions: [...permissions], groups: [...groups], displayName }
    try {
      return await work(mocks)
    } catch (error) {
      permissions = snapshot.permissions
      groups = snapshot.groups
      displayName = snapshot.displayName
      throw error
    }
  })
})

describe('role permissions', () => {
  it('rolls back role details and existing permissions when replacement fails', async () => {
    mocks.rolePermission.createMany.mockRejectedValue(new Error('write failed'))
    await expect(
      handleUpdateRole({
        data: { id: 'role-1', displayName: 'Changed', permissionIds: ['new-permission'] },
      })
    ).rejects.toThrow('write failed')
    expect(displayName).toBe('Original')
    expect(permissions).toEqual(['old-permission'])
    expect(mocks.clearAccessControlCache).not.toHaveBeenCalled()
  })

  it('rolls back permission assignment when replacement fails', async () => {
    mocks.rolePermission.createMany.mockRejectedValue(new Error('write failed'))
    await expect(
      handleAssignPermissions({
        data: { roleId: 'role-1', permissionIds: ['new-permission'] },
      })
    ).rejects.toThrow('write failed')
    expect(permissions).toEqual(['old-permission'])
    expect(mocks.reinitAuth).not.toHaveBeenCalled()
  })

  it('deduplicates permissions and refreshes authorization after saving', async () => {
    await handleAssignPermissions({
      data: { roleId: 'role-1', permissionIds: ['new-permission', 'new-permission'] },
    })
    expect(permissions).toEqual(['new-permission'])
    expect(mocks.clearAccessControlCache).toHaveBeenCalledOnce()
    expect(mocks.reinitAuth).toHaveBeenCalledOnce()
  })

  it('supports explicitly removing all permissions without an empty createMany', async () => {
    await handleAssignPermissions({ data: { roleId: 'role-1', permissionIds: [] } })
    expect(permissions).toEqual([])
    expect(mocks.rolePermission.createMany).not.toHaveBeenCalled()
  })

  it('preserves permissions when updating only role details', async () => {
    await handleUpdateRole({ data: { id: 'role-1', displayName: 'Changed' } })
    expect(displayName).toBe('Changed')
    expect(permissions).toEqual(['old-permission'])
    expect(mocks.rolePermission.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects a missing role even when the submitted permission list is empty', async () => {
    mocks.role.findUnique.mockResolvedValue(null)
    await expect(handleAssignPermissions({ data: { roleId: 'missing', permissionIds: [] } })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect(mocks.rolePermission.deleteMany).not.toHaveBeenCalled()
  })

  it('preserves system role protection', async () => {
    mocks.role.findUnique.mockResolvedValue({ id: 'role-1', isSystem: true })
    await expect(handleAssignPermissions({ data: { roleId: 'role-1', permissionIds: [] } })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(mocks.rolePermission.deleteMany).not.toHaveBeenCalled()
  })
})

describe('role navigation groups', () => {
  it('validates every group before removing the existing assignment', async () => {
    await expect(
      handleAssignRoleNavGroups({
        data: { id: 'role-1', navGroupIds: ['new-group', 'missing'] },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(groups).toEqual(['old-group'])
    expect(mocks.roleNavGroup.deleteMany).not.toHaveBeenCalled()
  })

  it('rolls back existing menu groups when replacement fails', async () => {
    mocks.roleNavGroup.createMany.mockRejectedValue(new Error('write failed'))
    await expect(handleAssignRoleNavGroups({ data: { id: 'role-1', navGroupIds: ['new-group'] } })).rejects.toThrow(
      'write failed'
    )
    expect(groups).toEqual(['old-group'])
    expect(mocks.clearAccessControlCache).not.toHaveBeenCalled()
  })

  it('deduplicates navigation groups', async () => {
    await handleAssignRoleNavGroups({ data: { id: 'role-1', navGroupIds: ['new-group', 'new-group'] } })
    expect(groups).toEqual(['new-group'])
    expect(mocks.reinitAuth).toHaveBeenCalledOnce()
  })

  it('allows an explicit empty assignment', async () => {
    mocks.navGroup.findMany.mockResolvedValue([])
    await handleAssignRoleNavGroups({ data: { id: 'role-1', navGroupIds: [] } })
    expect(groups).toEqual([])
    expect(mocks.roleNavGroup.createMany).not.toHaveBeenCalled()
  })

  it('rejects unauthorized writes before accessing the database', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('unauthorized'))
    await expect(handleAssignRoleNavGroups({ data: { id: 'role-1', navGroupIds: [] } })).rejects.toThrow('unauthorized')
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.getRoleNameById).not.toHaveBeenCalled()
  })
})
