/**
 * Permission Check - 权限检查工具函数
 * 基于 better-auth 的角色系统 + 自定义细粒度权限
 */

import prisma from '@/shared/lib/db'
import { auth } from '~/modules/identity/shared/lib/auth'

/**
 * 检查用户的全局角色权限（better-auth）
 */
type AuthHeaders = Headers | Record<string, string>

function toPermissionObject(permission: string) {
    const [resource, action] = permission.split(':')
    if (!resource || !action) return null
    return { [resource]: [action] }
}

export async function checkGlobalPermission(
    userId: string,
    permission: string,
    headers?: AuthHeaders
): Promise<boolean> {
    try {
        const permissions = toPermissionObject(permission)
        if (!permissions) return false

        const result = await auth.api.userHasPermission({
            headers,
            body: {
                userId,
                permissions,
            },
        })

        return result?.success ?? false
    } catch (error) {
        console.error('全局权限检查失败:', error)
        return false
    }
}

/**
 * 获取角色的权限列表（从数据库动态加载）
 */
async function getRolePermissions(role: string, scope: 'GLOBAL' | 'ORGANIZATION' = 'GLOBAL'): Promise<string[]> {
    try {
        const normalizedRole = role.replace(/^(GLOBAL|ORGANIZATION):/, '')
        const roleNames = [
            `${scope}:${normalizedRole}`,
            normalizedRole,
        ]
        if (scope === 'ORGANIZATION') {
            roleNames.push(`org-${normalizedRole}`)
        }

        const dbRole = await prisma.role.findFirst({
            where: {
                scope,
                OR: [
                    ...roleNames.map(name => ({ name })),
                    { name: { endsWith: `:${normalizedRole}` } },
                ],
            },
            include: {
                rolePermissions: {
                    include: {
                        permission: true
                    }
                }
            }
        })

        if (!dbRole) return []

        return dbRole.rolePermissions.map(rp => rp.permission.code)
    } catch (error) {
        console.error(`获取角色 ${role} 权限失败:`, error)
        return []
    }
}

/**
 * 检查用户在组织中的权限
 */
export async function checkOrgPermission(
    userId: string,
    organizationId: string,
    permission: string,
    headers?: AuthHeaders
): Promise<boolean> {
    try {
        const permissions = toPermissionObject(permission)
        if (!permissions) return false

        const result = await auth.api.hasOrgPermission({
            headers,
            body: {
                organizationId,
                permission: permissions,
            },
        })

        return !!result
    } catch (error) {
        console.error('组织权限检查失败:', error)
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
    },
    headers?: AuthHeaders
): Promise<boolean> {
    if (options?.organizationId) {
        return await checkOrgPermission(userId, options.organizationId, permissionName, headers)
    }
    return await checkGlobalPermission(userId, permissionName, headers)
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
            for (const role of roles) {
                const rolePerms = await getRolePermissions(role, 'GLOBAL')
                permissions.push(...rolePerms)
            }
        }
        
        // 2. 如果指定了组织，获取组织角色权限
        if (organizationId) {
            const member = await prisma.member.findFirst({
                where: { userId, organizationId }
            })
            
            if (member) {
                const orgRolePerms = await getRolePermissions(member.role, 'ORGANIZATION')
                permissions.push(...orgRolePerms)
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
