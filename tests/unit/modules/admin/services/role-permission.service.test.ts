/**
 * RolePermission Service 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 使用 vi.hoisted() 解决 mock 提升问题
const { mockRolePermission, mockSystemRole, mockTransaction } = vi.hoisted(() => ({
    mockRolePermission: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    mockSystemRole: {
        findUnique: vi.fn(),
    },
    mockTransaction: vi.fn(),
}))

vi.mock('@/shared/lib/db', () => ({
    default: {
        rolePermission: mockRolePermission,
        systemRole: mockSystemRole,
        $transaction: mockTransaction,
    },
}))

// 导入服务（在 mock 之后）
import { RolePermissionService } from '@/modules/admin/features/rbac/permissions/services/role-permission.service'

describe('RolePermissionService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getRolePermissions', () => {
        it('应该返回角色的权限列表', async () => {
            const mockData = [
                { id: 'rp1', roleId: 'role1', permissionId: 'perm1', permission: { name: 'user:create' } },
                { id: 'rp2', roleId: 'role1', permissionId: 'perm2', permission: { name: 'user:read' } },
            ]
            mockRolePermission.findMany.mockResolvedValue(mockData)

            const result = await RolePermissionService.getRolePermissions('role1')

            expect(result).toEqual(mockData)
            expect(mockRolePermission.findMany).toHaveBeenCalledWith({
                where: { roleId: 'role1' },
                include: { permission: true },
                orderBy: { createdAt: 'desc' }
            })
        })

        it('角色没有权限时应该返回空数组', async () => {
            mockRolePermission.findMany.mockResolvedValue([])

            const result = await RolePermissionService.getRolePermissions('role1')

            expect(result).toEqual([])
        })
    })

    describe('assignPermissions', () => {
        it('应该为角色分配权限', async () => {
            mockSystemRole.findUnique.mockResolvedValue({ id: 'role1', name: 'admin' })
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    rolePermission: {
                        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
                        createMany: vi.fn().mockResolvedValue({ count: 2 }),
                    }
                }
                return await callback(tx)
            })

            const permissions = [
                { permissionId: 'perm1', dataScope: 'ORG' },
                { permissionId: 'perm2' },
            ]

            const result = await RolePermissionService.assignPermissions('role1', permissions)

            expect(result).toEqual({ success: true })
            expect(mockSystemRole.findUnique).toHaveBeenCalledWith({ where: { id: 'role1' } })
        })

        it('角色不存在时应该抛出错误', async () => {
            mockSystemRole.findUnique.mockResolvedValue(null)

            await expect(
                RolePermissionService.assignPermissions('nonexistent', [])
            ).rejects.toThrow('角色不存在')
        })

        it('应该使用默认的 dataScope', async () => {
            mockSystemRole.findUnique.mockResolvedValue({ id: 'role1' })

            let capturedData: Array<{ roleId: string; permissionId: string; dataScope: string }> = []
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    rolePermission: {
                        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
                        createMany: vi.fn().mockImplementation(({ data }) => {
                            capturedData = data
                            return { count: data.length }
                        }),
                    }
                }
                return await callback(tx)
            })

            await RolePermissionService.assignPermissions('role1', [
                { permissionId: 'perm1' }
            ])

            expect(capturedData[0].dataScope).toBe('SELF')
        })
    })

    describe('updateDataScope', () => {
        it('应该更新权限的数据范围', async () => {
            const mockUpdated = { id: 'rp1', dataScope: 'ORG' }
            mockRolePermission.update.mockResolvedValue(mockUpdated)

            const result = await RolePermissionService.updateDataScope('rp1', 'ORG')

            expect(result).toEqual(mockUpdated)
            expect(mockRolePermission.update).toHaveBeenCalledWith({
                where: { id: 'rp1' },
                data: { dataScope: 'ORG' }
            })
        })
    })

    describe('removePermission', () => {
        it('应该删除角色的单个权限', async () => {
            mockRolePermission.delete.mockResolvedValue({ id: 'rp1' })

            const result = await RolePermissionService.removePermission('rp1')

            expect(result).toEqual({ success: true })
            expect(mockRolePermission.delete).toHaveBeenCalledWith({
                where: { id: 'rp1' }
            })
        })
    })
})
