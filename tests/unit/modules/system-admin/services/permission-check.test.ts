/**
 * Permission Check 工具函数单元测试  
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 使用 vi.hoisted() 解决 mock 提升问题
const { mockMember, mockUser, mockRole } = vi.hoisted(() => ({
    mockMember: {
        findFirst: vi.fn(),
    },
    mockUser: {
        findUnique: vi.fn(),
    },
    mockRole: {
        findUnique: vi.fn(),
    },
}))

vi.mock('@/shared/lib/db', () => ({
    default: {
        member: mockMember,
        user: mockUser,
        role: mockRole,
    },
}))

// 导入函数（在 mock 之后）
import {
    checkPermission,
    requirePermission,
    getUserPermissions,
    checkAnyPermission,
    checkAllPermissions,
} from '@/modules/system-admin/shared/lib/permission-check'

describe('permission-check', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    const mockMemberWithPermissions = {
        id: 'member1',
        userId: 'user1',
        role: 'admin',
    }

    const mockRoleWithPermissions = {
        id: 'role1',
        name: 'GLOBAL:admin',
        rolePermissions: [
            { permission: { code: 'user:create' } },
            { permission: { code: 'user:read' } },
            { permission: { code: 'department:create' } },
        ],
    }

    describe('checkPermission', () => {
        it('用户有权限时应该返回 true', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkPermission('user1', 'user:create')

            expect(result).toBe(true)
        })

        it('用户没有权限时应该返回 false', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkPermission('user1', 'user:delete')

            expect(result).toBe(false)
        })

        it('用户没有成员关系时应该返回 false', async () => {
            mockUser.findUnique.mockResolvedValue({ role: '' })

            const result = await checkPermission('user1', 'user:create')

            expect(result).toBe(false)
        })

        it('用户没有系统角色时应该返回 false', async () => {
            mockUser.findUnique.mockResolvedValue({ role: '' })

            const result = await checkPermission('user1', 'user:create')

            expect(result).toBe(false)
        })

        it('应该支持组织ID筛选', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)
            mockMember.findFirst.mockResolvedValue(mockMemberWithPermissions)

            await checkPermission('user1', 'user:create', { organizationId: 'org1' })

            expect(mockMember.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'user1', organizationId: 'org1' }
                })
            )
        })

        it('发生错误时应该返回 false', async () => {
            mockUser.findUnique.mockRejectedValue(new Error('Database error'))

            const result = await checkPermission('user1', 'user:create')

            expect(result).toBe(false)
        })
    })

    describe('requirePermission', () => {
        it('用户有权限时不应该抛出错误', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            await expect(requirePermission('user1', 'user:create')).resolves.not.toThrow()
        })

        it('用户没有权限时应该抛出错误', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            await expect(requirePermission('user1', 'user:delete')).rejects.toThrow('权限不足')
        })
    })

    describe('getUserPermissions', () => {
        it('应该返回用户的所有权限名称', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await getUserPermissions('user1')

            expect(result).toEqual(['user:create', 'user:read', 'department:create'])
        })

        it('用户没有权限时应该返回空数组', async () => {
            mockUser.findUnique.mockResolvedValue({ role: '' })

            const result = await getUserPermissions('user1')

            expect(result).toEqual([])
        })

        it('发生错误时应该返回空数组', async () => {
            mockUser.findUnique.mockRejectedValue(new Error('Database error'))

            const result = await getUserPermissions('user1')

            expect(result).toEqual([])
        })
    })

    describe('checkAnyPermission', () => {
        it('用户有任一权限时应该返回 true', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkAnyPermission('user1', ['user:delete', 'user:create'])

            expect(result).toBe(true)
        })

        it('用户没有任何权限时应该返回 false', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkAnyPermission('user1', ['user:delete', 'organization:delete'])

            expect(result).toBe(false)
        })
    })

    describe('checkAllPermissions', () => {
        it('用户有所有权限时应该返回 true', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkAllPermissions('user1', ['user:create', 'user:read'])

            expect(result).toBe(true)
        })

        it('用户缺少任一权限时应该返回 false', async () => {
            mockUser.findUnique.mockResolvedValue({ role: 'admin' })
            mockRole.findUnique.mockResolvedValue(mockRoleWithPermissions)

            const result = await checkAllPermissions('user1', ['user:create', 'user:delete'])

            expect(result).toBe(false)
        })
    })
})
