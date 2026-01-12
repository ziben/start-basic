/**
 * Permission Check - 权限检查工具函数
 * 基于 better-auth 的角色系统 + 自定义细粒度权限
 */

import prisma from '@/shared/lib/db'

/**
 * 检查用户的全局角色权限（better-auth）
 */
export async function checkGlobalPermission(
    userId: string,
    permission: string
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user?.role) return false

        const roles = user.role.split(',').map((r) => r.trim())

        // superadmin 拥有所有权限
        if (roles.includes('superadmin')) return true
        
        // 检查 better-auth 定义的权限
        const [resource, action] = permission.split(':')
        if (!resource || !action) return false
        
        // 根据角色检查权限（从 auth.ts 的定义）
        const allPermissions = roles.flatMap((role) => getRolePermissions(role))
        return allPermissions.some(p => {
            if (p === '*') return true
            const [r, a] = p.split(':')
            return (r === resource && (a === action || a === '*'))
        })
    } catch (error) {
        console.error('全局权限检查失败:', error)
        return false
    }
}

/**
 * 获取角色的权限列表（从 auth.ts 配置）
 */
function getRolePermissions(role: string): string[] {
    const roleMap: Record<string, string[]> = {
        superadmin: ['*'],
        admin: [
            'user:create', 'user:read', 'user:update', 'user:delete', 'user:ban',
            'org:create', 'org:read', 'org:update', 'org:delete',
            'role:manage', 'permission:manage', 'nav:manage', 'member:manage'
        ],
        user: ['profile:read', 'profile:update']
    }
    return roleMap[role] || []
}

/**
 * 检查用户在组织中的权限
 */
export async function checkOrgPermission(
    userId: string,
    organizationId: string,
    permission: string
): Promise<boolean> {
    try {
        // 1. 先检查全局权限
        const hasGlobal = await checkGlobalPermission(userId, permission)
        if (hasGlobal) return true

        // 2. 检查组织成员角色
        const member = await prisma.member.findFirst({
            where: { userId, organizationId }
        })

        if (!member) return false

        // 3. 检查组织角色权限
        const orgPermissions = getOrgRolePermissions(member.role)
        const [resource, action] = permission.split(':')
        
        const hasOrgPermission = orgPermissions.some(p => {
            if (p === '*') return true
            const [r, a] = p.split(':')
            return (r === resource && (a === action || a === '*'))
        })

        if (hasOrgPermission) return true

        // 4. 检查自定义细粒度权限
        return await checkCustomPermission(member.role, permission)
    } catch (error) {
        console.error('组织权限检查失败:', error)
        return false
    }
}

/**
 * 获取组织角色的权限列表
 */
function getOrgRolePermissions(role: string): string[] {
    const roleMap: Record<string, string[]> = {
        owner: ['org:*', 'member:*'],
        admin: ['member:read', 'member:update', 'org:read'],
        member: ['org:read']
    }
    return roleMap[role] || []
}

/**
 * 检查自定义细粒度权限（从 RolePermission 表）
 */
async function checkCustomPermission(
    role: string,
    permissionName: string
): Promise<boolean> {
    try {
        const rolePermission = await prisma.rolePermission.findFirst({
            where: {
                role: { name: role },
                permission: { code: permissionName },
                // 检查时间限制
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: new Date() } }
                ],
                AND: [
                    {
                        OR: [
                            { validUntil: null },
                            { validUntil: { gte: new Date() } }
                        ]
                    }
                ]
            },
            include: { permission: true }
        })

        return !!rolePermission
    } catch (error) {
        console.error('自定义权限检查失败:', error)
        return false
    }
}

/**
 * 通用权限检查（自动判断全局或组织）
 */
export async function checkPermission(
    userId: string,
    permissionName: string,
    options?: {
        organizationId?: string
        departmentId?: string
    }
): Promise<boolean> {
    if (options?.organizationId) {
        return await checkOrgPermission(userId, options.organizationId, permissionName)
    }
    return await checkGlobalPermission(userId, permissionName)
}

/**
 * 要求用户有指定权限（用于 ServerFn）
 */
export async function requirePermission(
    userId: string,
    permissionName: string,
    options?: {
        organizationId?: string
        departmentId?: string
    }
) {
    const hasPermission = await checkPermission(userId, permissionName, options)

    if (!hasPermission) {
        throw new Error(`权限不足：需要 ${permissionName} 权限`)
    }
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(
    userId: string,
    organizationId?: string
): Promise<string[]> {
    try {
        const permissions: string[] = []
        
        // 1. 获取全局角色权限
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })
        
        if (user?.role) {
            const roles = user.role.split(',').map((r) => r.trim())
            roles.forEach((role) => {
                permissions.push(...getRolePermissions(role))
            })
        }
        
        // 2. 如果指定了组织，获取组织角色权限
        if (organizationId) {
            const member = await prisma.member.findFirst({
                where: { userId, organizationId }
            })
            
            if (member) {
                permissions.push(...getOrgRolePermissions(member.role))
                
                // 3. 获取自定义细粒度权限
                const customPermissions = await prisma.rolePermission.findMany({
                    where: {
                        role: { name: member.role },
                        OR: [
                            { validFrom: null },
                            { validFrom: { lte: new Date() } }
                        ],
                        AND: [
                            {
                                OR: [
                                    { validUntil: null },
                                    { validUntil: { gte: new Date() } }
                                ]
                            }
                        ]
                    },
                    include: { permission: true }
                })
                
                permissions.push(...customPermissions.map(rp => rp.permission.code))
            }
        }
        
        // 去重
        return [...new Set(permissions)]
    } catch (error) {
        console.error('获取用户权限失败:', error)
        return []
    }
}

/**
 * 检查用户是否有任一权限
 */
export async function checkAnyPermission(
    userId: string,
    permissionNames: string[],
    options?: {
        organizationId?: string
    }
): Promise<boolean> {
    const userPermissions = await getUserPermissions(userId, options?.organizationId)

    return permissionNames.some(name => userPermissions.includes(name))
}

/**
 * 检查用户是否有所有权限
 */
export async function checkAllPermissions(
    userId: string,
    permissionNames: string[],
    options?: {
        organizationId?: string
    }
): Promise<boolean> {
    const userPermissions = await getUserPermissions(userId, options?.organizationId)

    return permissionNames.every(name => userPermissions.includes(name))
}
