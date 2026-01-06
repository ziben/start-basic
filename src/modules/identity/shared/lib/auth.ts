import prisma from '@/shared/lib/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, username, organization } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'

/**
 * 权限声明
 * 定义系统中所有资源和可执行的操作
 */
export const statement = {
  user: ['create', 'read', 'update', 'delete', 'ban'],
  org: ['create', 'read', 'update', 'delete'],
  role: ['manage'],
  permission: ['manage'],
  nav: ['manage'],
  member: ['manage'],
  profile: ['read', 'update'],
} as const

/**
 * 创建访问控制器
 */
export const ac = createAccessControl(statement)

/**
 * 角色定义
 *
 * 全局角色（User.role）：
 * - superadmin: 超级管理员，拥有所有权限
 * - admin: 管理员，可以管理用户、组织、角色、权限
 * - user: 普通用户，只能管理自己的资料
 */
export const superadmin = ac.newRole({
  user: ['create', 'read', 'update', 'delete', 'ban'],
  org: ['create', 'read', 'update', 'delete'],
  role: ['manage'],
  permission: ['manage'],
  nav: ['manage'],
  member: ['manage'],
  profile: ['read', 'update'],
})

export const adminRole = ac.newRole({
  user: ['create', 'read', 'update', 'delete', 'ban'],
  org: ['create', 'read', 'update', 'delete'],
  role: ['manage'],
  permission: ['manage'],
  nav: ['manage'],
  member: ['manage'],
  profile: ['read', 'update'],
})

export const userRole = ac.newRole({
  profile: ['read', 'update'],
})

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    username(),
    organization({
      teams: { enabled: true },
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    admin({
      defaultRole: 'user',
      ac,
      roles: {
        superadmin,
        admin: adminRole,
        user: userRole,
      },
    }),
  ],
  user: {
    additionalFields: {
      // role 字段由 admin 插件自动添加，不需要在这里定义
      // banned, banReason, banExpires 也由 admin 插件自动添加
      displayUsername: { type: 'string', required: false },
    },
  },
})
