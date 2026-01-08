/**
 * Profile Server Function
 * 获取当前用户的角色和权限信息
 */

import { createServerFn } from '@tanstack/react-start'
import { getDb } from '@/shared/lib/db'
import { getAuth } from '~/modules/identity/shared/lib/auth'

export type PermissionInfo = {
  code: string
  displayName: string
  resource: string
  action: string
  category: string | null
}

export type RoleInfo = {
  id: string
  name: string
  displayName: string
  description: string | null
  scope: string
  isSystem: boolean
}

export type OrganizationRoleInfo = {
  organization: {
    id: string
    name: string
    slug: string | null
    logo: string | null
  }
  role: RoleInfo | null
  permissions: PermissionInfo[]
  joinedAt: Date
}

export type UserProfileData = {
  user: {
    id: string
    name: string
    email: string
    username: string | null
    role: string | null
    image: string | null
    createdAt: Date
  }
  globalRole: RoleInfo | null
  globalPermissions: PermissionInfo[]
  organizationRoles: OrganizationRoleInfo[]
  stats: {
    totalPermissions: number
    organizationCount: number
    globalRole: string
  }
}

/**
 * 获取当前用户的完整权限信息
 */
export const getUserProfileFn = createServerFn({ method: 'GET' }).handler(
  async ({ request }: { request: Request }): Promise<UserProfileData | null> => {
    const auth = await getAuth()
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return null
    }

    const prisma = await getDb()
    const userId = session.user.id

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return null
    }

    // 获取用户的全局角色信息
    let globalRole: RoleInfo | null = null
    let globalPermissions: PermissionInfo[] = []

    if (user.role) {
      const roleRecord = await prisma.role.findFirst({
        where: {
          name: {
            endsWith: `:${user.role}`,
          },
          scope: 'GLOBAL',
        },
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

      if (roleRecord) {
        globalRole = {
          id: roleRecord.id,
          name: user.role,
          displayName: roleRecord.displayName,
          description: roleRecord.description,
          scope: roleRecord.scope,
          isSystem: roleRecord.isSystem,
        }

        globalPermissions = roleRecord.rolePermissions.map((rp) => ({
          code: rp.permission.code,
          displayName: rp.permission.displayName,
          resource: rp.permission.resource.displayName,
          action: rp.permission.action.displayName,
          category: rp.permission.category,
        }))
      }
    }

    // 获取用户所属的组织和组织角色
    const memberships = await prisma.member.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    })

    const organizationRoles = await Promise.all(
      memberships.map(async (membership) => {
        const roleRecord = await prisma.role.findFirst({
          where: {
            name: {
              endsWith: `:${membership.role}`,
            },
            scope: 'ORGANIZATION',
          },
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

        return {
          organization: membership.organization,
          role: roleRecord
            ? {
                id: roleRecord.id,
                name: membership.role,
                displayName: roleRecord.displayName,
                description: roleRecord.description,
                scope: roleRecord.scope,
                isSystem: roleRecord.isSystem,
              }
            : null,
          permissions: roleRecord
            ? roleRecord.rolePermissions.map((rp) => ({
                code: rp.permission.code,
                displayName: rp.permission.displayName,
                resource: rp.permission.resource.displayName,
                action: rp.permission.action.displayName,
                category: rp.permission.category,
              }))
            : [],
          joinedAt: membership.createdAt,
        }
      })
    )

    // 统计信息
    const stats = {
      totalPermissions:
        globalPermissions.length +
        organizationRoles.reduce((sum, org) => sum + org.permissions.length, 0),
      organizationCount: memberships.length,
      globalRole: user.role || 'user',
    }

    return {
      user,
      globalRole,
      globalPermissions,
      organizationRoles,
      stats,
    }
  }
)
