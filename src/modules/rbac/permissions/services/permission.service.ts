/**
 * Permission Service - 权限管理业务逻辑层
 * [迁移自 admin/shared/services/permission.service.ts]
 */

import prisma from '@/shared/lib/db'
import type { Prisma } from '~/generated/prisma/client'

export interface ListPermissionsInput {
    page?: number
    pageSize?: number
    filter?: string
    resource?: string
}

export interface CreatePermissionInput {
    resourceId: string
    actionId: string
    displayName: string
    category?: string
    description?: string
}

export interface UpdatePermissionInput {
    displayName?: string
    category?: string
    description?: string
}

export const PermissionService = {
    /**
     * 获取所有权限（不分页）
     */
    async getAll(options?: {
        resource?: string
        action?: string
    }) {
        const where: Prisma.PermissionWhereInput = {}

        if (options?.resource) {
            where.resource = { name: options.resource }
        }
        if (options?.action) {
            where.action = { name: options.action }
        }

        return await prisma.permission.findMany({
            where,
            include: { resource: true, action: true },
            orderBy: { code: 'asc' },
        })
    },

    /**
     * 获取权限列表（分页）
     */
    async getList(input: ListPermissionsInput = {}) {
        try {
            const { page = 1, pageSize = 20, filter, resource } = input

            const where: Prisma.PermissionWhereInput = {}

            if (filter) {
                where.OR = [
                    { code: { contains: filter } },
                    { displayName: { contains: filter } },
                    { description: { contains: filter } },
                    { category: { contains: filter } },
                    { resource: { name: { contains: filter } } },
                    { action: { name: { contains: filter } } },
                ]
            }

            if (resource) {
                where.resource = { name: resource }
            }

            const [total, items] = await Promise.all([
                prisma.permission.count({ where }),
                prisma.permission.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: { resource: true, action: true },
                    orderBy: { code: 'asc' },
                })
            ])

            return {
                items,
                total,
                page,
                pageSize,
                pageCount: Math.ceil(total / pageSize)
            }
        } catch (error) {
            console.error('获取权限列表失败:', error)
            throw new Error('获取权限列表失败')
        }
    },

    /**
     * 根据ID获取权限
     */
    async getById(id: string) {
        try {
            const permission = await prisma.permission.findUnique({
                where: { id },
                include: {
                    rolePermissions: {
                        include: {
                            role: true
                        }
                    }
                }
            })

            if (!permission) {
                throw new Error('权限不存在')
            }

            return permission
        } catch (error) {
            console.error('获取权限失败:', error)
            throw error instanceof Error ? error : new Error('获取权限失败')
        }
    },

    /**
     * 创建权限
     */
    async create(data: CreatePermissionInput) {
        try {
            const [resource, action] = await Promise.all([
                prisma.resource.findUnique({ where: { id: data.resourceId } }),
                prisma.action.findUnique({ where: { id: data.actionId } }),
            ])

            if (!resource || !action) {
                throw new Error('资源或操作不存在')
            }

            const code = `${resource.name}:${action.name}`

            // 检查是否已存在
            const existing = await prisma.permission.findUnique({
                where: { code }
            })

            if (existing) {
                throw new Error('权限已存在')
            }

            return await prisma.permission.create({
                data: {
                    ...data,
                    code,
                    isSystem: false,
                },
                include: { resource: true, action: true },
            })
        } catch (error) {
            console.error('创建权限失败:', error)
            throw error instanceof Error ? error : new Error('创建权限失败')
        }
    },

    /**
     * 更新权限
     */
    async update(id: string, data: UpdatePermissionInput) {
        try {
            const permission = await prisma.permission.findUnique({
                where: { id }
            })

            if (!permission) {
                throw new Error('权限不存在')
            }

            return await prisma.permission.update({
                where: { id },
                data
            })
        } catch (error) {
            console.error('更新权限失败:', error)
            throw error instanceof Error ? error : new Error('更新权限失败')
        }
    },

    /**
     * 删除权限
     */
    async delete(id: string) {
        try {
            const permission = await prisma.permission.findUnique({
                where: { id }
            })

            if (!permission) {
                throw new Error('权限不存在')
            }

            // 检查是否被使用
            const rolePermCount = await prisma.rolePermission.count({
                where: { permissionId: id }
            })

            if (rolePermCount > 0) {
                throw new Error('权限正在被使用，无法删除')
            }

            await prisma.permission.delete({
                where: { id }
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除权限失败:', error)
            throw error instanceof Error ? error : new Error('删除权限失败')
        }
    }
}

export default PermissionService
