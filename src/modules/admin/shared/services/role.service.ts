/**
 * Role Service - 基于 better-auth 的角色管理
 * 角色在 auth.ts 中定义，这里提供查询和管理接口
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface Role {
    name: string
    label: string
    description: string
    isSystem: boolean
    permissions: string[]
}

export interface ListRolesInput {
    page?: number
    pageSize?: number
    filter?: string
}

// ============ 角色定义（从 auth.ts 同步）============

const ROLES: Role[] = [
    {
        name: 'superadmin',
        label: '超级管理员',
        description: '拥有所有权限',
        isSystem: true,
        permissions: ['*']
    },
    {
        name: 'admin',
        label: '管理员',
        description: '可以管理用户、组织、角色、权限',
        isSystem: true,
        permissions: [
            'user:create', 'user:read', 'user:update', 'user:delete', 'user:ban',
            'org:create', 'org:read', 'org:update', 'org:delete',
            'role:manage', 'permission:manage', 'nav:manage', 'member:manage'
        ]
    },
    {
        name: 'user',
        label: '普通用户',
        description: '只能管理自己的资料',
        isSystem: true,
        permissions: ['profile:read', 'profile:update']
    }
]

// ============ Service 实现 ============

export const RoleService = {
    /**
     * 获取角色列表（分页）
     */
    async getList(input: ListRolesInput = {}) {
        try {
            const { page = 1, pageSize = 10, filter = '' } = input

            let roles = ROLES

            // 过滤
            if (filter) {
                const lowerFilter = filter.toLowerCase()
                roles = roles.filter(r => 
                    r.name.toLowerCase().includes(lowerFilter) ||
                    r.label.toLowerCase().includes(lowerFilter) ||
                    r.description.toLowerCase().includes(lowerFilter)
                )
            }

            const total = roles.length
            const pageCount = Math.ceil(total / pageSize)
            const start = (page - 1) * pageSize
            const items = roles.slice(start, start + pageSize)

            return {
                items,
                total,
                page,
                pageSize,
                pageCount,
            }
        } catch (error) {
            console.error('获取角色列表失败:', error)
            throw new Error('获取角色列表失败')
        }
    },

    /**
     * 获取所有角色（不分页）
     */
    async getAll() {
        return ROLES
    },

    /**
     * 获取单个角色
     */
    async getById(name: string) {
        try {
            const role = ROLES.find(r => r.name === name)

            if (!role) {
                throw new Error('角色不存在')
            }

            // 获取关联的导航组
            const navGroups = await prisma.roleNavGroup.findMany({
                where: { roleName: name },
                include: { navGroup: true }
            })

            return {
                ...role,
                navGroups
            }
        } catch (error) {
            console.error('获取角色失败:', error)
            throw new Error('获取角色失败')
        }
    },

    /**
     * 设置用户角色（直接更新数据库）
     */
    async setUserRole(userId: string, role: string) {
        try {
            // 验证角色是否存在
            if (!ROLES.find(r => r.name === role)) {
                throw new Error('角色不存在')
            }

            // 直接更新用户角色
            await prisma.user.update({
                where: { id: userId },
                data: { role }
            })

            return { success: true as const }
        } catch (error) {
            console.error('设置用户角色失败:', error)
            throw error instanceof Error ? error : new Error('设置用户角色失败')
        }
    },

    /**
     * 为角色分配菜单组
     */
    async assignNavGroups(roleName: string, navGroupIds: string[]) {
        try {
            // 验证角色是否存在
            if (!ROLES.find(r => r.name === roleName)) {
                throw new Error('角色不存在')
            }

            return await prisma.$transaction(async (tx) => {
                // 1. 删除原有的关联
                await tx.roleNavGroup.deleteMany({
                    where: { roleName },
                })

                // 2. 创建新的关联
                if (navGroupIds.length > 0) {
                    await tx.roleNavGroup.createMany({
                        data: navGroupIds.map((navGroupId) => ({
                            roleName,
                            navGroupId,
                        })),
                    })
                }

                return { success: true as const }
            })
        } catch (error) {
            console.error('分配菜单组失败:', error)
            throw error instanceof Error ? error : new Error('分配菜单组失败')
        }
    },
}

export default RoleService
