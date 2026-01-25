/**
 * 组织角色管理 ServerFn
 * 管理基于模板的组织角色实例
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'
import type { Prisma } from '~/generated/prisma/client'

// ============ Schema 定义 ============

const ListOrgRolesSchema = z.object({
  organizationId: z.string().min(1, '组织ID不能为空'),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
})

const CreateOrgRoleSchema = z.object({
  organizationId: z.string().min(1, '组织ID不能为空'),
  role: z.string().min(1, '角色名称不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  templateRoleId: z.string().optional(),
  copyTemplatePermissions: z.boolean().default(true),
  isActive: z.boolean().default(true),
  metadata: z.any().optional(),
})

const UpdateOrgRoleSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
})

const AssignOrgRolePermissionsSchema = z.object({
  organizationRoleId: z.string().min(1, '组织角色ID不能为空'),
  permissionIds: z.array(z.string()),
  dataScope: z.string().default('ORG'),
})

// ============ 组织角色管理 ============

/**
 * 获取组织角色列表
 */
export const getOrganizationRolesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof ListOrgRolesSchema>) => ListOrgRolesSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof ListOrgRolesSchema> }) => {
    await requireAdmin('ListOrganizationRoles')
    const prisma = (await import('@/shared/lib/db')).default

    const { organizationId, page = 1, pageSize = 10, search, isActive } = data

    const where: Prisma.OrganizationRoleWhereInput = { organizationId }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { role: { contains: search } },
        { displayName: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [total, roles] = await Promise.all([
      prisma.organizationRole.count({ where }),
      prisma.organizationRole.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          templateRole: {
            select: {
              id: true,
              name: true,
              displayName: true,
              scope: true,
            },
          },
          _count: {
            select: {
              permissions: true,
              members: true,
            },
          },
        },
      }),
    ])

    return {
      data: roles,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  })

/**
 * 获取单个组织角色详情
 */
export const getOrganizationRoleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('GetOrganizationRoleDetail')
    const prisma = (await import('@/shared/lib/db')).default

    return prisma.organizationRole.findUnique({
      where: { id: data.id },
      include: {
        templateRole: true,
        permissions: {
          include: {
            permission: {
              include: {
                resource: true,
                action: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })
  })

/**
 * 创建组织角色
 */
export const createOrganizationRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateOrgRoleSchema>) => CreateOrgRoleSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateOrgRoleSchema> }) => {
    await requireAdmin('CreateOrganizationRole')
    const prisma = (await import('@/shared/lib/db')).default

    const { copyTemplatePermissions, ...roleData } = data

    // 检查组织是否存在
    const org = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    })

    if (!org) {
      throw new Error('组织不存在')
    }

    // 检查角色名称是否在组织内已存在
    const existing = await prisma.organizationRole.findUnique({
      where: {
        organizationId_role: {
          organizationId: data.organizationId,
          role: data.role,
        },
      },
    })

    if (existing) {
      throw new Error('该组织内已存在同名角色')
    }

    // 创建组织角色
    const orgRole = await prisma.organizationRole.create({
      data: {
        id: crypto.randomUUID(),
        ...roleData,
      },
      include: {
        templateRole: true,
      },
    })

    // 如果基于模板创建且需要复制权限
    if (data.templateRoleId && copyTemplatePermissions) {
      const templatePermissions = await prisma.rolePermission.findMany({
        where: { roleId: data.templateRoleId },
      })

      if (templatePermissions.length > 0) {
        await prisma.organizationRolePermission.createMany({
          data: templatePermissions.map((tp) => ({
            organizationRoleId: orgRole.id,
            permissionId: tp.permissionId,
            dataScope: tp.dataScope,
            customScope: tp.customScope as Prisma.InputJsonValue,
          })),
        })
      }
    }

    return orgRole
  })

/**
 * 更新组织角色
 */
export const updateOrganizationRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateOrgRoleSchema>) => UpdateOrgRoleSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateOrgRoleSchema> }) => {
    await requireAdmin('UpdateOrganizationRole')
    const prisma = (await import('@/shared/lib/db')).default

    const { id, ...updateData } = data

    return prisma.organizationRole.update({
      where: { id },
      data: updateData,
      include: {
        templateRole: true,
        _count: {
          select: {
            permissions: true,
            members: true,
          },
        },
      },
    })
  })

/**
 * 删除组织角色
 */
export const deleteOrganizationRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }: { data: { id: string } }) => {
    await requireAdmin('DeleteOrganizationRole')
    const prisma = (await import('@/shared/lib/db')).default

    // 检查是否有成员使用此角色
    const membersCount = await prisma.member.count({
      where: { organizationRoleId: data.id },
    })

    if (membersCount > 0) {
      throw new Error(`无法删除：还有 ${membersCount} 个成员使用此角色`)
    }

    await prisma.organizationRole.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

/**
 * 为组织角色分配权限
 */
export const assignOrganizationRolePermissionsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof AssignOrgRolePermissionsSchema>) =>
    AssignOrgRolePermissionsSchema.parse(data)
  )
  .handler(async ({ data }: { data: z.infer<typeof AssignOrgRolePermissionsSchema> }) => {
    await requireAdmin('AssignOrganizationRolePermissions')
    const prisma = (await import('@/shared/lib/db')).default

    // 删除旧的权限关联
    await prisma.organizationRolePermission.deleteMany({
      where: { organizationRoleId: data.organizationRoleId },
    })

    // 创建新的权限关联
    if (data.permissionIds.length > 0) {
      await prisma.organizationRolePermission.createMany({
        data: data.permissionIds.map((permissionId: string) => ({
          organizationRoleId: data.organizationRoleId,
          permissionId,
          dataScope: data.dataScope,
        })),
      })
    }

    return { success: true }
  })

/**
 * 获取组织角色的权限列表
 */
export const getOrganizationRolePermissionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationRoleId: string }) => data)
  .handler(async ({ data }: { data: { organizationRoleId: string } }) => {
    await requireAdmin('GetOrganizationRolePermissions')
    const prisma = (await import('@/shared/lib/db')).default

    return prisma.organizationRolePermission.findMany({
      where: { organizationRoleId: data.organizationRoleId },
      include: {
        permission: {
          include: {
            resource: true,
            action: true,
          },
        },
      },
    })
  })

/**
 * 获取可用的角色模板列表
 */
export const getRoleTemplatesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListRoleTemplates')
    const prisma = (await import('@/shared/lib/db')).default

    return prisma.role.findMany({
      where: {
        isTemplate: true,
        isActive: true,
      },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    })
  })
