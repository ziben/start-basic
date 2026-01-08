/**
 * RBAC 统一权限管理 ServerFn
 * 管理角色、资源、操作、权限和角色-权限关联
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'
import { clearAccessControlCache, reinitAuth } from '~/modules/identity/shared/lib/auth'

// ============ Schema 定义 ============

// 角色相关
const CreateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'ORGANIZATION', 'CUSTOM']),
  permissionIds: z.array(z.string()).optional(),
})

const UpdateRoleSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string()).optional(),
})

// 资源相关
const CreateResourceSchema = z.object({
  name: z.string().min(1, '资源名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'ORGANIZATION', 'BOTH']),
})

const UpdateResourceSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
})

// 操作相关
const CreateActionSchema = z.object({
  resourceId: z.string().min(1, '资源ID不能为空'),
  name: z.string().min(1, '操作名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
})

const UpdateActionSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
})

// 权限相关
const CreatePermissionSchema = z.object({
  resourceId: z.string().min(1, '资源ID不能为空'),
  actionId: z.string().min(1, '操作ID不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  category: z.string().optional(),
})

const UpdatePermissionSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
})

// 角色-权限关联
const AssignPermissionsSchema = z.object({
  roleId: z.string().min(1, '角色ID不能为空'),
  permissionIds: z.array(z.string()),
})

// ============ 角色管理 ============

export const getRolesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListRoles')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.role.findMany({
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
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
    })
  })

export const getRoleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin('GetRoleDetail')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.role.findUnique({
      where: { id: data.id },
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
  })

export const createRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateRoleSchema>) => CreateRoleSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('CreateRole')
    const prisma = (await import('@/shared/lib/db')).default
    
    const { permissionIds, ...roleData } = data
    
    const role = await prisma.role.create({
      data: {
        ...roleData,
        name: `${data.scope}:${data.name}`,
        isSystem: false,
        rolePermissions: permissionIds ? {
          create: permissionIds.map(permissionId => ({
            permissionId,
          })),
        } : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })
    
    // 清除缓存并重新初始化 auth
    clearAccessControlCache()
    await reinitAuth()
    
    return role
  })

export const updateRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateRoleSchema>) => UpdateRoleSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('UpdateRole')
    const prisma = (await import('@/shared/lib/db')).default
    
    const { id, permissionIds, ...updateData } = data
    
    // 检查是否是系统角色
    const role = await prisma.role.findUnique({ where: { id } })
    if (role?.isSystem) {
      throw new Error('系统角色不允许修改')
    }
    
    // 更新角色
    const updated = await prisma.role.update({
      where: { id },
      data: updateData,
    })
    
    // 如果提供了权限列表，更新权限关联
    if (permissionIds !== undefined) {
      // 删除旧的权限关联
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      })
      
      // 创建新的权限关联
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: id,
          permissionId,
        })),
      })
    }
    
    // 清除缓存并重新初始化 auth
    clearAccessControlCache()
    await reinitAuth()
    
    return updated
  })

export const deleteRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin('DeleteRole')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 检查是否是系统角色
    const role = await prisma.role.findUnique({ where: { id: data.id } })
    if (role?.isSystem) {
      throw new Error('系统角色不允许删除')
    }
    
    await prisma.role.delete({
      where: { id: data.id },
    })
    
    // 清除缓存并重新初始化 auth
    clearAccessControlCache()
    await reinitAuth()
    
    return { success: true }
  })

// ============ 资源管理 ============

export const getResourcesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListResources')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.resource.findMany({
      include: {
        actions: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    })
  })

export const createResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateResourceSchema>) => CreateResourceSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('CreateResource')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.resource.create({
      data: {
        ...data,
        isSystem: false,
      },
    })
  })

export const updateResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateResourceSchema>) => UpdateResourceSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('UpdateResource')
    const prisma = (await import('@/shared/lib/db')).default
    
    const { id, ...updateData } = data
    
    // 检查是否是系统资源
    const resource = await prisma.resource.findUnique({ where: { id } })
    if (resource?.isSystem) {
      throw new Error('系统资源不允许修改')
    }
    
    return prisma.resource.update({
      where: { id },
      data: updateData,
    })
  })

export const deleteResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin('DeleteResource')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 检查是否是系统资源
    const resource = await prisma.resource.findUnique({ where: { id: data.id } })
    if (resource?.isSystem) {
      throw new Error('系统资源不允许删除')
    }
    
    await prisma.resource.delete({
      where: { id: data.id },
    })
    
    return { success: true }
  })

// ============ 操作管理 ============

export const getActionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: { resourceId?: string }) => data || {})
  .handler(async ({ data }) => {
    await requireAdmin('ListActions')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.action.findMany({
      where: data.resourceId ? { resourceId: data.resourceId } : undefined,
      include: {
        resource: true,
      },
      orderBy: { name: 'asc' },
    })
  })

export const createActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateActionSchema>) => CreateActionSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('CreateAction')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.action.create({
      data: {
        ...data,
        isSystem: false,
      },
      include: {
        resource: true,
      },
    })
  })

export const updateActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateActionSchema>) => UpdateActionSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('UpdateAction')
    const prisma = (await import('@/shared/lib/db')).default
    
    const { id, ...updateData } = data
    
    // 检查是否是系统操作
    const action = await prisma.action.findUnique({ where: { id } })
    if (action?.isSystem) {
      throw new Error('系统操作不允许修改')
    }
    
    return prisma.action.update({
      where: { id },
      data: updateData,
    })
  })

export const deleteActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin('DeleteAction')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 检查是否是系统操作
    const action = await prisma.action.findUnique({ where: { id: data.id } })
    if (action?.isSystem) {
      throw new Error('系统操作不允许删除')
    }
    
    await prisma.action.delete({
      where: { id: data.id },
    })
    
    return { success: true }
  })

// ============ 权限管理 ============

export const getPermissionsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListPermissions')
    const prisma = (await import('@/shared/lib/db')).default
    
    return prisma.permission.findMany({
      include: {
        resource: true,
        action: true,
      },
      orderBy: { code: 'asc' },
    })
  })

export const createPermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreatePermissionSchema>) => CreatePermissionSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('CreatePermission')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 获取资源和操作信息
    const resource = await prisma.resource.findUnique({ where: { id: data.resourceId } })
    const action = await prisma.action.findUnique({ where: { id: data.actionId } })
    
    if (!resource || !action) {
      throw new Error('资源或操作不存在')
    }
    
    const code = `${resource.name}:${action.name}`
    
    return prisma.permission.create({
      data: {
        ...data,
        code,
        isSystem: false,
      },
      include: {
        resource: true,
        action: true,
      },
    })
  })

export const updatePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdatePermissionSchema>) => UpdatePermissionSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('UpdatePermission')
    const prisma = (await import('@/shared/lib/db')).default
    
    const { id, ...updateData } = data
    
    // 检查是否是系统权限
    const permission = await prisma.permission.findUnique({ where: { id } })
    if (permission?.isSystem) {
      throw new Error('系统权限不允许修改')
    }
    
    return prisma.permission.update({
      where: { id },
      data: updateData,
    })
  })

export const deletePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin('DeletePermission')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 检查是否是系统权限
    const permission = await prisma.permission.findUnique({ where: { id: data.id } })
    if (permission?.isSystem) {
      throw new Error('系统权限不允许删除')
    }
    
    await prisma.permission.delete({
      where: { id: data.id },
    })
    
    return { success: true }
  })

// ============ 角色-权限关联管理 ============

export const assignPermissionsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof AssignPermissionsSchema>) => AssignPermissionsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin('AssignPermissions')
    const prisma = (await import('@/shared/lib/db')).default
    
    // 检查是否是系统角色
    const role = await prisma.role.findUnique({ where: { id: data.roleId } })
    if (role?.isSystem) {
      throw new Error('系统角色不允许修改权限')
    }
    
    // 删除旧的权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: data.roleId },
    })
    
    // 创建新的权限关联
    await prisma.rolePermission.createMany({
      data: data.permissionIds.map(permissionId => ({
        roleId: data.roleId,
        permissionId,
      })),
    })
    
    // 清除缓存并重新初始化 auth
    clearAccessControlCache()
    await reinitAuth()
    
    return { success: true }
  })

// ============ 权限矩阵查询 ============

export const getPermissionMatrixFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ViewPermissionMatrix')
    const prisma = (await import('@/shared/lib/db')).default
    
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      }),
      prisma.permission.findMany({
        include: {
          resource: true,
          action: true,
        },
        orderBy: { code: 'asc' },
      }),
    ])
    
    return {
      roles,
      permissions,
      matrix: roles.map(role => ({
        roleId: role.id,
        roleName: role.name,
        roleDisplayName: role.displayName,
        scope: role.scope,
        isSystem: role.isSystem,
        permissions: role.rolePermissions.map(rp => rp.permission.code),
      })),
    }
  })
