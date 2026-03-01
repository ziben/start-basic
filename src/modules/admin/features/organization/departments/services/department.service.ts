/**
 * Department Service - 部门管理业务逻辑层
 * [迁移自 admin/shared/services/department.service.ts]
 */

import prisma from '@/shared/lib/db'

// ============ 类型定义 ============

export interface CreateDepartmentInput {
    name: string
    code: string
    organizationId: string
    parentId?: string
    leader?: string
    phone?: string
    email?: string
    sort?: number
}

export interface UpdateDepartmentInput {
    name?: string
    code?: string
    parentId?: string
    leader?: string
    phone?: string
    email?: string
    sort?: number
    status?: 'ACTIVE' | 'INACTIVE'
}

// ============ Service 实现 ============

export const DepartmentService = {
    /**
     * 获取组织的所有部门
     */
    async getByOrganization(organizationId: string) {
        try {
            return await prisma.department.findMany({
                where: { organizationId },
                orderBy: [
                    { level: 'asc' },
                    { sort: 'asc' },
                ],
                include: {
                    parent: true,
                    children: true,
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            console.error('获取部门列表失败:', error)
            throw new Error('获取部门列表失败')
        }
    },

    /**
     * 获取单个部门
     */
    async getById(id: string) {
        try {
            const department = await prisma.department.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                }
                            }
                        }
                    }
                }
            })

            if (!department) {
                throw new Error('部门不存在')
            }

            return department
        } catch (error) {
            console.error('获取部门失败:', error)
            throw error instanceof Error ? error : new Error('获取部门失败')
        }
    },

    /**
     * 创建部门
     */
    async create(data: CreateDepartmentInput) {
        try {
            // 检查编码是否重复
            const existing = await prisma.department.findFirst({
                where: {
                    organizationId: data.organizationId,
                    code: data.code,
                }
            })

            if (existing) {
                throw new Error('部门编码已存在')
            }

            // 验证并计算层级
            let level = 1
            if (data.parentId) {
                const parent = await prisma.department.findUnique({
                    where: { id: data.parentId }
                })
                if (!parent) {
                    throw new Error('父部门不存在')
                }
                // 验证父部门是否属于同一组织
                if (parent.organizationId !== data.organizationId) {
                    throw new Error('父部门必须属于同一组织')
                }
                level = parent.level + 1
            }

            return await prisma.department.create({
                data: {
                    name: data.name,
                    code: data.code,
                    organizationId: data.organizationId,
                    parentId: data.parentId,
                    level,
                    sort: data.sort ?? 0,
                    leader: data.leader,
                    phone: data.phone,
                    email: data.email,
                },
                include: {
                    parent: true,
                    children: true,
                }
            })
        } catch (error) {
            console.error('创建部门失败:', error)
            throw error instanceof Error ? error : new Error('创建部门失败')
        }
    },

    /**
     * 更新部门
     */
    async update(id: string, data: UpdateDepartmentInput) {
        try {
            // 如果更改了父部门，需要重新计算层级
            let level: number | undefined
            if (data.parentId !== undefined) {
                if (data.parentId === null) {
                    level = 1
                } else {
                    const parent = await prisma.department.findUnique({
                        where: { id: data.parentId }
                    })
                    if (parent) {
                        level = parent.level + 1
                    }
                }
            }

            const updateData: UpdateDepartmentInput & { level?: number } = { ...data }
            if (level !== undefined) {
                updateData.level = level
            }

            return await prisma.department.update({
                where: { id },
                data: updateData,
                include: {
                    parent: true,
                    children: true,
                }
            })
        } catch (error) {
            console.error('更新部门失败:', error)
            throw error instanceof Error ? error : new Error('更新部门失败')
        }
    },

    /**
     * 删除部门
     */
    async delete(id: string) {
        try {
            // 检查是否有子部门
            const children = await prisma.department.count({
                where: { parentId: id }
            })

            if (children > 0) {
                throw new Error('该部门下还有子部门，无法删除')
            }

            // 检查是否有成员
            const members = await prisma.member.count({
                where: { departmentId: id }
            })

            if (members > 0) {
                throw new Error('该部门下还有成员，无法删除')
            }

            await prisma.department.delete({
                where: { id }
            })

            return { success: true as const, id }
        } catch (error) {
            console.error('删除部门失败:', error)
            throw error instanceof Error ? error : new Error('删除部门失败')
        }
    },

    /**
     * 获取部门树
     */
    async getTree(organizationId: string) {
        try {
            const departments = await this.getByOrganization(organizationId)

            // 定义部门树节点类型
            interface DepartmentTreeNode {
                id: string
                name: string
                code: string
                level: number
                parentId: string | null
                children: DepartmentTreeNode[]
                [key: string]: unknown
            }

            // 构建树形结构
            const buildTree = (parentId: string | null = null): DepartmentTreeNode[] => {
                return departments
                    .filter(dept => dept.parentId === parentId)
                    .map(dept => ({
                        ...dept,
                        children: buildTree(dept.id)
                    }) as DepartmentTreeNode)
            }

            return buildTree(null)
        } catch (error) {
            console.error('获取部门树失败:', error)
            throw new Error('获取部门树失败')
        }
    },

    /**
     * 获取下级部门（包括所有子孙部门）
     */
    async getSubDepartments(departmentId: string): Promise<string[]> {
        try {
            const department = await prisma.department.findUnique({
                where: { id: departmentId },
                include: {
                    children: {
                        include: {
                            children: {
                                include: {
                                    children: true // 支持3层嵌套
                                }
                            }
                        }
                    }
                }
            })

            if (!department) {
                return []
            }

            // 定义嵌套部门类型
            interface NestedDepartment {
                id: string
                children?: NestedDepartment[]
            }

            const collectIds = (dept: NestedDepartment): string[] => {
                const ids = [dept.id]
                if (dept.children) {
                    dept.children.forEach((child: NestedDepartment) => {
                        ids.push(...collectIds(child))
                    })
                }
                return ids
            }

            return collectIds(department).filter(id => id !== departmentId)
        } catch (error) {
            console.error('获取下级部门失败:', error)
            throw new Error('获取下级部门失败')
        }
    }
}

export default DepartmentService
