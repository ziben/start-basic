/**
 * Better-Auth 初始化
 * 使用动态加载的权限配置
 */

import { betterAuth, type Auth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, username, organization, bearer } from 'better-auth/plugins'
import { getDb } from '@/shared/lib/db'
import { getRuntimeConfig } from '~/infrastructure/config/runtime-config'
import { getAccessControl } from './auth-dynamic'
import { wechatOAuth } from './plugins/wechat-oauth'
import { userCreatedPlugin } from './plugins/user-created-plugin'

let authInstance: Auth<any> | null = null

/**
 * 初始化 better-auth 实例
 */
export async function initAuth() {
  if (authInstance) {
    return authInstance
  }

  console.log('🔐 初始化 Better-Auth...')

  // 获取数据库实例
  const prisma = await getDb()

  // 加载权限配置
  const { globalAc, orgAc, globalRoles, orgRoles } = await getAccessControl(prisma)

  // 创建 better-auth 实例
  const trustedOrigins = getRuntimeConfig('auth.trustedOrigins')

  authInstance = betterAuth({
    trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      bearer(),
      username(),
      organization({
        teams: { enabled: false }, // 禁用 teams，使用 OrganizationRole
        allowUserToCreateOrganization: true,
        organizationLimit: 10,
        dynamicAccessControl: {
          enabled: true,
          ac: orgAc,
          roles: orgRoles,
        },
      }),
      admin({
        defaultRole: 'user',
        ac: globalAc,
        roles: globalRoles,
      }),
      // 微信 OAuth 登录
      ...(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET
        ? [
          wechatOAuth({
            appId: process.env.WECHAT_APP_ID,
            appSecret: process.env.WECHAT_APP_SECRET,
            syntheticEmailDomain: 'wechat.local',
            debug: process.env.NODE_ENV === 'development',
          }),
        ]
        : []),
      // 用户创建钩子插件
      userCreatedPlugin(),
    ],
    user: {
      additionalFields: {
        displayUsername: { type: 'string', required: false },
      },
    },
  })


  console.log('✅ Better-Auth 初始化完成')

  return authInstance
}

/**
 * 获取 auth 实例（懒加载）
 */
export async function getAuth() {
  if (!authInstance) {
    await initAuth()
  }
  return authInstance!
}

/**
 * 重新初始化 auth（权限更新后调用）
 */
export async function reinitAuth() {
  authInstance = null
  return initAuth()
}
