/**
 * Better-Auth 初始化
 * 使用动态加载的权限配置
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, username, organization, genericOAuth } from 'better-auth/plugins'
import { getDb } from '@/shared/lib/db'
import { getAccessControl } from './auth-dynamic'

let authInstance: ReturnType<typeof betterAuth> | null = null

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

  // 微信 OAuth 配置
  const wechatConfig = getWeChatOAuthConfig()

  // 创建 better-auth 实例
  authInstance = betterAuth({
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
      ...(wechatConfig ? [genericOAuth({ config: [wechatConfig] })] : []),
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

/**
 * 获取微信 OAuth 配置 (用于 genericOAuth 插件)
 *
 * @returns 微信 OAuth 配置对象，如果未配置则返回 null
 */
function getWeChatOAuthConfig() {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    console.log('⚠️ 微信登录未配置 (缺少 WECHAT_APP_ID 或 WECHAT_APP_SECRET)')
    return null
  }

  return {
    providerId: 'wechat',
    clientId: appId,
    clientSecret: appSecret,
    // 微信不支持标准 OIDC，需要自定义 URL
    authorizationUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    scopes: ['snsapi_login'],
    // 自定义 token 交换 (微信使用 GET 请求)
    getToken: async ({ code, redirectURI }: { code: string; redirectURI: string }) => {
      const params = new URLSearchParams({
        appid: appId,
        secret: appSecret,
        code,
        grant_type: 'authorization_code',
      })

      const response = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`
      )
      const data = await response.json()

      if (data.errcode) {
        throw new Error(`WeChat OAuth error: ${data.errmsg} (${data.errcode})`)
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: data.scope?.split(',') ?? [],
        raw: data, // 保存 openid 等信息
      }
    },
    // 自定义获取用户信息
    getUserInfo: async (tokens: { accessToken?: string; raw?: Record<string, unknown> }) => {
      const openid = tokens.raw?.openid as string
      const accessToken = tokens.accessToken
      if (!openid || !accessToken) {
        throw new Error('Missing openid or accessToken in token response')
      }

      const params = new URLSearchParams({
        access_token: accessToken,
        openid,
        lang: 'zh_CN',
      })

      const response = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?${params.toString()}`
      )
      const data = await response.json()

      if (data.errcode) {
        throw new Error(`WeChat userinfo error: ${data.errmsg} (${data.errcode})`)
      }

      return {
        id: openid,
        name: data.nickname || '微信用户',
        email: `${openid}@wechat.placeholder`, // 微信不提供邮箱，生成占位符
        image: data.headimgurl,
        emailVerified: false,
      }
    },
  }
}
