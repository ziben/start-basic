/**
 * RBAC 统一权限管理 ServerFn
 * 管理角色、资源、操作、权限和角色-权限关联
 * [迁移自 admin/shared/server-fns/rbac.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { clearAccessControlCache, reinitAuth } from '~/modules/auth/shared/lib/auth'

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

// 角色管理相关的校验
const ListRolesSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  filter: z.string().optional(),
})

// 角色-导航组关联
const AssignRoleNavGroupsSchema = z.object({
  id: z.string().min(1, '角色ID不能为空'),
  navGroupIds: z.array(z.string()),
})

// ============ 角色管理 ============

export const getRolesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof ListRolesSchema>) => ListRolesSchema.parse(data || {}))
  .handler(async ({ data }: { data: z.infer<typeof ListRolesSchema> }) => {
    await requireAdmin('ListRoles')
    const prisma = (await import('@/shared/lib/db')).default

    const { page = 1, pageSize = 10, filter } = data

    const where: any = {}
    if (filter) {
      where.OR = [
        { name: { contains: filter } },
        { displayName: { contains: filter } },
        { description: { contains: filter } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
    ])

    return {
      items,
      total,
      pageCount: Math.ceil(total / pageSize),
    }
  })

export const getRoleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('GetRoleDetail')
    const prisma = (await import('@/shared/lib/db')).default

    return prisma.role.findUnique({
      where: { id: data.id },
      include: {
        navGroupLinks: true,
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
  .handler(async ({ data }: { data: z.infer<typeof CreateRoleSchema> }) => {
    await requireAdmin('CreateRole')
    const prisma = (await import('@/shared/lib/db')).default

    const { permissionIds, ...roleData } = data

    const role = await prisma.role.create({
      data: {
        ...roleData,
        name: `${data.scope}:${data.name}`,
        isSystem: false,
        rolePermissions: permissionIds ? {
          create: permissionIds.map((permissionId: string) => ({
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
  .handler(async ({ data }: { data: z.infer<typeof UpdateRoleSchema> }) => {
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
        data: permissionIds.map((permissionId: string) => ({
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
  .handler(async ({ data }: { data: { id: string } }) => {
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

export const assignRoleNavGroupsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof AssignRoleNavGroupsSchema>) => AssignRoleNavGroupsSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof AssignRoleNavGroupsSchema> }) => {
    await requireAdmin('AssignRoleNavGroups')
    const prisma = (await import('@/shared/lib/db')).default

    const role = await prisma.role.findUnique({ where: { id: data.id } })
    if (!role) throw new Error('角色不存在')

    // 删除旧关联
    await prisma.roleNavGroup.deleteMany({
      where: { roleName: role.name }
    })

    // 创建新关联
    if (data.navGroupIds.length > 0) {
      const navGroups = await prisma.navGroup.findMany({
        where: { id: { in: data.navGroupIds } }
      })

      await prisma.roleNavGroup.createMany({
        data: navGroups.map(ng => ({
          roleName: role.name,
          navGroupId: ng.id
        }))
      })
    }

    // 清除缓存
    clearAccessControlCache()
    await reinitAuth()

    return { success: true }
  })

// ============ 资源管理 ============

export const getResourcesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListResources')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.getResources()
  })

export const createResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateResourceSchema>) => CreateResourceSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateResourceSchema> }) => {
    await requireAdmin('CreateResource')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.createResource(data)
  })

export const updateResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateResourceSchema>) => UpdateResourceSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateResourceSchema> }) => {
    await requireAdmin('UpdateResource')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    const { id, ...updateData } = data
    return ResourceService.updateResource(id, updateData)
  })

export const deleteResourceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteResource')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    await ResourceService.deleteResource(data.id)
    return { success: true }
  })

// ============ 操作管理 ============

export const getActionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: { resourceId?: string }) => data || {})
  .handler(async ({ data }: { data: { resourceId?: string } }) => {
    await requireAdmin('ListActions')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.getActions(data.resourceId)
  })

export const createActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateActionSchema>) => CreateActionSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateActionSchema> }) => {
    await requireAdmin('CreateAction')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.createAction(data)
  })

export const updateActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateActionSchema>) => UpdateActionSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateActionSchema> }) => {
    await requireAdmin('UpdateAction')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    const { id, ...updateData } = data
    return ResourceService.updateAction(id, updateData)
  })

export const deleteActionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteAction')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    await ResourceService.deleteAction(data.id)
    return { success: true }
  })

// ============ 权限管理 ============

export const getPermissionsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListPermissions')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.getPermissions()
  })

export const createPermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreatePermissionSchema>) => CreatePermissionSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreatePermissionSchema> }) => {
    await requireAdmin('CreatePermission')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    return ResourceService.createPermission(data)
  })

export const updatePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdatePermissionSchema>) => UpdatePermissionSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdatePermissionSchema> }) => {
    await requireAdmin('UpdatePermission')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    const { id, ...updateData } = data
    return ResourceService.updatePermission(id, updateData)
  })

export const deletePermissionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeletePermission')
    const { ResourceService } = await import('../permissions/services/rbac-resource.service')
    await ResourceService.deletePermission(data.id)
    return { success: true }
  })

// ============ 角色-权限关联管理 ============

export const assignPermissionsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof AssignPermissionsSchema>) => AssignPermissionsSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof AssignPermissionsSchema> }) => {
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
      data: data.permissionIds.map((permissionId: string) => ({
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
