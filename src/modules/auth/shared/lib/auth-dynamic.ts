/**
 * 动态加载权限配置
 * 从数据库加载角色、资源、操作、权限，并构建 better-auth 的 access control
 */

import { createAccessControl } from 'better-auth/plugins/access'
import type { PrismaClient } from '~/generated/prisma/client'

/**
 * 从数据库加载权限配置并创建 access control
 */
export async function loadAccessControl(prisma: PrismaClient) {
  console.log('🔄 从数据库加载权限配置...')

  // 1. 加载所有资源和操作
  const resources = await prisma.resource.findMany({
    include: { actions: true },
  })

  // 2. 构建 statement（资源-操作映射）
  const statement: Record<string, string[]> = {}
  const globalStatement: Record<string, string[]> = {}
  const orgStatement: Record<string, string[]> = {}

  for (const resource of resources) {
    const actions = resource.actions.map((a) => a.name)
    statement[resource.name] = actions

    // 根据作用域分类
    if (resource.scope === 'GLOBAL') {
      globalStatement[resource.name] = actions
    } else if (resource.scope === 'ORGANIZATION') {
      orgStatement[resource.name] = actions
    } else if (resource.scope === 'BOTH') {
      globalStatement[resource.name] = actions
      orgStatement[resource.name] = actions
    }
  }

  // 3. 创建 access control 实例
  const ac = createAccessControl(statement)
  const globalAc = createAccessControl(globalStatement)
  const orgAc = createAccessControl(orgStatement)

  // 4. 加载角色和权限
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      rolePermissions: {
        include: {
          permission: {
            include: {
              resource: true,
              action: true,
            },
          },
        },
      },
    },
  })

  // 5. 构建角色定义
  const globalRoles: Record<string, any> = {}
  const orgRoles: Record<string, any> = {}

  for (const role of roles) {
    // 构建该角色的权限映射
    const permissions: Record<string, string[]> = {}

    for (const rp of role.rolePermissions) {
      const resourceName = rp.permission.resource.name
      const actionName = rp.permission.action.name

      if (!permissions[resourceName]) {
        permissions[resourceName] = []
      }
      permissions[resourceName].push(actionName)
    }

    // 根据角色作用域分配到不同的 ac
    const roleName = role.name.replace(/^(GLOBAL|ORGANIZATION):/, '') // 移除作用域前缀

    if (role.scope === 'GLOBAL') {
      globalRoles[roleName] = globalAc.newRole(permissions)
    } else if (role.scope === 'ORGANIZATION') {
      orgRoles[roleName] = orgAc.newRole(permissions)
    }
  }

  console.log(`✅ 加载完成: ${resources.length} 个资源, ${roles.length} 个角色`)

  return {
    ac,
    globalAc,
    orgAc,
    statement,
    globalStatement,
    orgStatement,
    globalRoles,
    orgRoles,
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name.replace(/^(GLOBAL|ORGANIZATION):/, ''),
      displayName: r.displayName,
      scope: r.scope,
      isSystem: r.isSystem,
    })),
  }
}

/**
 * 缓存的 access control（避免每次请求都查数据库）
 */
let cachedAC: Awaited<ReturnType<typeof loadAccessControl>> | null = null
let lastLoadTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

/**
 * 获取 access control（带缓存）
 */
export async function getAccessControl(prisma: PrismaClient) {
  const now = Date.now()

  if (!cachedAC || now - lastLoadTime > CACHE_TTL) {
    cachedAC = await loadAccessControl(prisma)
    lastLoadTime = now
  }

  return cachedAC
}

/**
 * 清除缓存（权限更新后调用）
 */
export function clearAccessControlCache() {
  cachedAC = null
  lastLoadTime = 0
  console.log('🗑️  权限缓存已清除')
}

/**
 * 获取角色的权限列表
 */
export async function getRolePermissions(
  prisma: PrismaClient,
  roleName: string,
  scope: 'GLOBAL' | 'ORGANIZATION'
): Promise<string[]> {
  const fullRoleName = `${scope}:${roleName}`
  
  const role = await prisma.role.findUnique({
    where: { name: fullRoleName },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!role) return []

  return role.rolePermissions.map((rp) => rp.permission.code)
}

/**
 * 检查角色是否有指定权限
 */
export async function checkRolePermission(
  prisma: PrismaClient,
  roleName: string,
  permissionCode: string,
  scope: 'GLOBAL' | 'ORGANIZATION'
): Promise<boolean> {
  const permissions = await getRolePermissions(prisma, roleName, scope)
  return permissions.includes(permissionCode)
}
