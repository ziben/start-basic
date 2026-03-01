/**
 * Permission Service 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 使用 vi.hoisted() 解决 mock 提升问题
const { mockPermission, mockRolePermission } = vi.hoisted(() => ({
    mockPermission: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    mockRolePermission: {
        count: vi.fn(),
    },
}))

vi.mock('@/shared/lib/db', () => ({
    default: {
        permission: mockPermission,
        rolePermission: mockRolePermission,
    },
}))

// 导入服务（在 mock 之后）
import { PermissionService } from '@/modules/admin/features/rbac/permissions/services/permission.service'

describe('PermissionService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getAll', () => {
        it('应该返回所有权限', async () => {
            const mockData = [
                { id: '1', name: 'user:create', resource: 'user', action: 'create', label: '创建用户' },
                { id: '2', name: 'user:read', resource: 'user', action: 'read', label: '查看用户' },
            ]
            mockPermission.findMany.mockResolvedValue(mockData)

            const result = await PermissionService.getAll()

            expect(result).toEqual(mockData)
            expect(mockPermission.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: [{ resource: 'asc' }, { action: 'asc' }]
            })
        })

        it('应该支持按资源筛选', async () => {
            mockPermission.findMany.mockResolvedValue([])

            await PermissionService.getAll({ resource: 'user' })

            expect(mockPermission.findMany).toHaveBeenCalledWith({
                where: { resource: 'user' },
                orderBy: [{ resource: 'asc' }, { action: 'asc' }]
            })
        })

        it('应该支持按操作筛选', async () => {
            mockPermission.findMany.mockResolvedValue([])

            await PermissionService.getAll({ action: 'create' })

            expect(mockPermission.findMany).toHaveBeenCalledWith({
                where: { action: 'create' },
                orderBy: [{ resource: 'asc' }, { action: 'asc' }]
            })
        })
    })

    describe('getList', () => {
        it('应该返回分页的权限列表', async () => {
            const mockItems = [{ id: '1', name: 'user:create' }]
            mockPermission.count.mockResolvedValue(1)
            mockPermission.findMany.mockResolvedValue(mockItems)

            const result = await PermissionService.getList({ page: 1, pageSize: 10 })

            expect(result).toEqual({
                items: mockItems,
                total: 1,
                page: 1,
                pageSize: 10,
                pageCount: 1
            })
        })

        it('应该使用默认分页参数', async () => {
            mockPermission.count.mockResolvedValue(0)
            mockPermission.findMany.mockResolvedValue([])

            const result = await PermissionService.getList()

            expect(result.page).toBe(1)
            expect(result.pageSize).toBe(20)
        })

        it('应该支持关键字搜索', async () => {
            mockPermission.count.mockResolvedValue(0)
            mockPermission.findMany.mockResolvedValue([])

            await PermissionService.getList({ filter: 'user' })

            expect(mockPermission.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { name: { contains: 'user' } },
                            { label: { contains: 'user' } },
                            { resource: { contains: 'user' } },
                        ]
                    }
                })
            )
        })
    })

    describe('getById', () => {
        it('应该返回单个权限', async () => {
            const mockData = { id: '1', name: 'user:create', rolePermissions: [] }
            mockPermission.findUnique.mockResolvedValue(mockData)

            const result = await PermissionService.getById('1')

            expect(result).toEqual(mockData)
            expect(mockPermission.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: { rolePermissions: { include: { role: true } } }
            })
        })

        it('权限不存在时应该抛出错误', async () => {
            mockPermission.findUnique.mockResolvedValue(null)

            await expect(PermissionService.getById('nonexistent')).rejects.toThrow('权限不存在')
        })
    })

    describe('create', () => {
        it('应该创建新权限', async () => {
            const input = { resource: 'user', action: 'create', label: '创建用户' }
            const mockCreated = { id: '1', name: 'user:create', ...input }

            mockPermission.findUnique.mockResolvedValue(null)
            mockPermission.create.mockResolvedValue(mockCreated)

            const result = await PermissionService.create(input)

            expect(result).toEqual(mockCreated)
            expect(mockPermission.create).toHaveBeenCalledWith({
                data: { ...input, name: 'user:create' }
            })
        })

        it('权限已存在时应该抛出错误', async () => {
            const input = { resource: 'user', action: 'create', label: '创建用户' }
            mockPermission.findUnique.mockResolvedValue({ id: '1' })

            await expect(PermissionService.create(input)).rejects.toThrow('权限已存在')
        })
    })

    describe('update', () => {
        it('应该更新权限', async () => {
            const mockExisting = { id: '1', name: 'user:create' }
            const mockUpdated = { ...mockExisting, label: '新标签' }

            mockPermission.findUnique.mockResolvedValue(mockExisting)
            mockPermission.update.mockResolvedValue(mockUpdated)

            const result = await PermissionService.update('1', { label: '新标签' })

            expect(result).toEqual(mockUpdated)
        })

        it('权限不存在时应该抛出错误', async () => {
            mockPermission.findUnique.mockResolvedValue(null)

            await expect(PermissionService.update('nonexistent', { label: '新标签' })).rejects.toThrow('权限不存在')
        })
    })

    describe('delete', () => {
        it('应该删除权限', async () => {
            mockPermission.findUnique.mockResolvedValue({ id: '1' })
            mockRolePermission.count.mockResolvedValue(0)
            mockPermission.delete.mockResolvedValue({ id: '1' })

            const result = await PermissionService.delete('1')

            expect(result).toEqual({ success: true, id: '1' })
        })

        it('权限不存在时应该抛出错误', async () => {
            mockPermission.findUnique.mockResolvedValue(null)

            await expect(PermissionService.delete('nonexistent')).rejects.toThrow('权限不存在')
        })

        it('权限正在使用时应该抛出错误', async () => {
            mockPermission.findUnique.mockResolvedValue({ id: '1' })
            mockRolePermission.count.mockResolvedValue(1)

            await expect(PermissionService.delete('1')).rejects.toThrow('权限正在被使用，无法删除')
        })
    })
})
