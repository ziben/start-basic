/**
 * WeChat OAuth Plugin for Better Auth
 * 基于 https://github.com/zreren/better-auth-wechat-example
 */

import type { BetterAuthPlugin, GenericEndpointContext, User } from 'better-auth'
import { generateState } from 'better-auth'
import { setSessionCookie } from 'better-auth/cookies'
import { createAuthEndpoint } from 'better-auth/api'
import { z } from 'zod'

interface WeChatOAuthOptions {
  appId: string
  appSecret: string
  /** 合成邮箱域名，用于生成唯一邮箱 */
  syntheticEmailDomain?: string
  /** 是否启用调试日志 */
  debug?: boolean
}

type TokenData = {
  access_token?: string
  refresh_token?: string
  openid?: string
  scope?: string
  expires_in?: number
  errcode?: number
  errmsg?: string
}

type WeChatProfile = {
  unionid?: string
  openid?: string
  nickname?: string
  headimgurl?: string
  errcode?: number
  errmsg?: string
}

type OAuthUser = User & Record<string, unknown>
type OAuthAccount = { id: string; providerId: string }
type OAuthUserResult = { user: OAuthUser; accounts: OAuthAccount[] }

export function wechatOAuth(options: WeChatOAuthOptions): BetterAuthPlugin {
  const { appId, appSecret, syntheticEmailDomain = 'wechat.local', debug = false } = options

  const AUTH_URL = 'https://open.weixin.qq.com/connect/oauth2/authorize'
  const TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token'
  const USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo'

  const signInBodySchema = z.object({
    callbackURL: z.string().optional(),
    errorCallbackURL: z.string().optional(),
    newUserCallbackURL: z.string().optional(),
    disableRedirect: z.boolean().optional(),
  })

  const callbackQuerySchema = z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
  })

  const fetchTokenData = async (
    ctx: GenericEndpointContext,
    buildErrorRedirect: (err: string) => string,
    code: string
  ): Promise<TokenData> => {
    const tokenUrl = new URL(TOKEN_URL)
    tokenUrl.searchParams.set('appid', appId)
    tokenUrl.searchParams.set('secret', appSecret)
    tokenUrl.searchParams.set('code', code)
    tokenUrl.searchParams.set('grant_type', 'authorization_code')

    const tokenResp = await fetch(tokenUrl.toString())
    const tokenData = (await tokenResp.json()) as TokenData

    if (!tokenData || tokenData.errcode) {
      const err = tokenData?.errmsg || 'wechat_token_error'
      if (debug) {
        console.error('[WeChat OAuth] Token error:', tokenData)
      }
      throw ctx.redirect(buildErrorRedirect(err))
    }

    return tokenData
  }

  const ensureTokenFields = (
    ctx: GenericEndpointContext,
    buildErrorRedirect: (err: string) => string,
    tokenData: TokenData
  ): {
    accessToken: string
    refreshToken?: string
    openid: string
    scope?: string
    expiresIn?: number
  } => {
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const openid = tokenData.openid
    const scope = tokenData.scope
    const expiresIn = tokenData.expires_in

    if (!accessToken || !openid) {
      throw ctx.redirect(buildErrorRedirect('wechat_token_missing_fields'))
    }

    return { accessToken, refreshToken, openid, scope, expiresIn }
  }

  const fetchUserProfile = async (
    ctx: GenericEndpointContext,
    buildErrorRedirect: (err: string) => string,
    accessToken: string,
    openid: string
  ): Promise<WeChatProfile> => {
    const userInfoUrl = new URL(USERINFO_URL)
    userInfoUrl.searchParams.set('access_token', accessToken)
    userInfoUrl.searchParams.set('openid', openid)
    userInfoUrl.searchParams.set('lang', 'zh_CN')

    if (debug) {
      const maskedUrl = new URL(userInfoUrl.toString())
      maskedUrl.searchParams.set('access_token', '***')
      console.log('[WeChat OAuth] Userinfo request:', maskedUrl.toString())
    }

    const userResp = await fetch(userInfoUrl.toString())
    const userText = await userResp.text()
    let profile: WeChatProfile

    try {
      profile = JSON.parse(userText) as WeChatProfile
    } catch (e) {
      if (debug) {
        console.error('[WeChat OAuth] Userinfo JSON parse failed:', {
          status: userResp.status,
          statusText: userResp.statusText,
          body: userText,
          error: e,
        })
      }
      throw ctx.redirect(buildErrorRedirect('wechat_userinfo_invalid_json'))
    }

    if (debug) {
      console.log('[WeChat OAuth] Userinfo response:', {
        status: userResp.status,
        statusText: userResp.statusText,
        body: profile,
      })
    }

    if (profile == null) {
      throw ctx.redirect(buildErrorRedirect('wechat_userinfo_error'))
    }

    if (profile.errcode) {
      const err = profile?.errmsg || 'wechat_userinfo_error'
      if (debug) {
        console.error('[WeChat OAuth] Userinfo error:', profile)
      }
      throw ctx.redirect(buildErrorRedirect(err))
    }

    return profile
  }

  const updateExistingAccount = async (params: {
    ctx: GenericEndpointContext
    existing: OAuthAccount
    openid: string
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    scope?: string
  }): Promise<void> => {
    const { ctx, existing, openid, accessToken, refreshToken, expiresIn, scope } = params
    const updateData = Object.fromEntries(
      Object.entries({
        accessToken,
        refreshToken,
        idToken: openid,
        accessTokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scope,
      }).filter(([_, v]) => v !== undefined)
    )
    if (Object.keys(updateData).length > 0) {
      await ctx.context.internalAdapter.updateAccount(
        existing.id,
        updateData as Record<string, unknown>
      )
    }
  }

  const linkAccount = async (params: {
    ctx: GenericEndpointContext
    buildErrorRedirect: (err: string) => string
    userId: string
    providerUserId: string
    openid: string
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    scope?: string
  }): Promise<void> => {
    const {
      ctx,
      buildErrorRedirect,
      userId,
      providerUserId,
      openid,
      accessToken,
      refreshToken,
      expiresIn,
      scope,
    } = params
    try {
      await ctx.context.internalAdapter.linkAccount({
        providerId: 'wechat',
        accountId: providerUserId.toString(),
        userId,
        accessToken,
        refreshToken,
        idToken: openid,
        accessTokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scope,
      })
    } catch (e) {
      if (debug) {
        console.error('[WeChat OAuth] Link account failed:', e)
      }
      throw ctx.redirect(buildErrorRedirect('unable_to_link_account'))
    }
  }

  const createOAuthUser = async (params: {
    ctx: GenericEndpointContext
    buildErrorRedirect: (err: string) => string
    profile: WeChatProfile
    email: string
    providerUserId: string
    openid: string
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    scope?: string
  }): Promise<OAuthUser> => {
    const {
      ctx,
      buildErrorRedirect,
      profile,
      email,
      providerUserId,
      openid,
      accessToken,
      refreshToken,
      expiresIn,
      scope,
    } = params
    const created = await ctx.context.internalAdapter
      .createOAuthUser(
        {
          email,
          emailVerified: true,
          name: profile.nickname ?? 'WeChat User',
          image: profile.headimgurl,
        },
        {
          providerId: 'wechat',
          accountId: providerUserId.toString(),
          accessToken,
          refreshToken,
          idToken: openid,
          accessTokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
          scope,
        }
      )
      .then((res: unknown) => (res as { user?: OAuthUser } | null)?.user)
      .catch((e: unknown) => {
        if (debug) {
          console.error('[WeChat OAuth] Create user failed:', e)
        }
        return null
      })

    if (!created) {
      throw ctx.redirect(buildErrorRedirect('unable_to_create_user'))
    }

    // 触发用户创建钩子
    try {
      const { fireUserCreatedHooks } = await import('../../../../admin/shared/lib/user-hooks')
      await fireUserCreatedHooks({
        userId: created.id,
        email: created.email,
        name: created.name,
        username: (created as any).username ?? undefined,
        role: (created as any).role ?? undefined,
        createdAt: new Date(created.createdAt),
      })
    } catch (hookError) {
      console.error('[WeChat OAuth] User creation hooks failed:', hookError)
      // 不影响OAuth流程，用户已创建
    }

    return created
  }

  const upsertOAuthUser = async (params: {
    ctx: GenericEndpointContext
    buildErrorRedirect: (err: string) => string
    profile: WeChatProfile
    providerUserId: string
    openid: string
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    scope?: string
  }): Promise<{ user: OAuthUser; isRegister: boolean }> => {
    const {
      ctx,
      buildErrorRedirect,
      profile,
      providerUserId,
      openid,
      accessToken,
      refreshToken,
      expiresIn,
      scope,
    } = params
    const email = `${providerUserId}@${syntheticEmailDomain}`.toLowerCase()
    const dbUser = (await ctx.context.internalAdapter
      .findOAuthUser(email, providerUserId, 'wechat')
      .catch(() => null)) as OAuthUserResult | null

    if (dbUser) {
      const existing = dbUser.accounts.find((a) => a.providerId === 'wechat')
      if (existing) {
        await updateExistingAccount({
          ctx,
          existing,
          openid,
          accessToken,
          refreshToken,
          expiresIn,
          scope,
        })
      } else {
        await linkAccount({
          ctx,
          buildErrorRedirect,
          userId: dbUser.user.id,
          providerUserId,
          openid,
          accessToken,
          refreshToken,
          expiresIn,
          scope,
        })
      }

      return { user: dbUser.user, isRegister: false }
    }

    const user = await createOAuthUser({
      ctx,
      buildErrorRedirect,
      profile,
      email,
      providerUserId,
      openid,
      accessToken,
      refreshToken,
      expiresIn,
      scope,
    })

    return { user, isRegister: true }
  }

  return {
    id: 'wechat-oauth',
    endpoints: {
      '/sign-in/wechat': createAuthEndpoint(
        '/sign-in/wechat',
        {
          method: 'POST',
          body: signInBodySchema,
        },
        async (ctx: GenericEndpointContext) => {
          const { state } = await generateState(ctx, undefined, ctx.body?.additionalData)

          const redirectUri = `${ctx.context.baseURL}/oauth2/callback/wechat`
          const url = new URL(AUTH_URL)
          url.searchParams.set('appid', appId)
          url.searchParams.set('redirect_uri', redirectUri)
          url.searchParams.set('response_type', 'code')
          url.searchParams.set('scope', 'snsapi_userinfo')
          url.searchParams.set('state', state)
          const finalUrl = `${url.toString()}#wechat_redirect`

          if (debug) {
            console.log('[WeChat OAuth] Authorization URL:', finalUrl)
          }

          return ctx.json({
            url: finalUrl,
            redirect: !ctx.body?.disableRedirect,
          })
        }
      ),

      '/oauth2/callback/wechat': createAuthEndpoint(
        '/oauth2/callback/wechat',
        {
          method: 'GET',
          query: callbackQuerySchema,
        },
        async (ctx: GenericEndpointContext) => {
          // 不使用 Better Auth 的 parseState —— 它内部会 delete verification 记录，
          // 并发请求或服务器重启后记录不存在时抛 Prisma P2025 导致登录失败。
          // 微信 OAuth 的 callbackURL 固定为 /zc/m，无需从 state 恢复。
          const callbackURL = '/zc/m'

          // 尝试清理 verification 记录（不影响主流程）
          const stateParam = ctx.query.state
          if (stateParam) {
            ctx.context.internalAdapter.deleteVerificationValue(stateParam).catch(() => { })
          }

          const buildErrorRedirect = (err: string): string => {
            const hasQuery = callbackURL.includes('?')
            const separator = hasQuery ? '&' : '?'
            return `${callbackURL}${separator}error=${encodeURIComponent(err)}`
          }


          if (ctx.query.error || !ctx.query.code) {
            const err = ctx.query.error || 'wechat_code_missing'
            throw ctx.redirect(buildErrorRedirect(err))
          }

          if (debug) {
            console.log('[WeChat OAuth] Callback query:', {
              hasCode: !!ctx.query.code,
              state: ctx.query.state,
              callbackURL,
            })
          }

          // 1. 交换 access_token
          const tokenData = await fetchTokenData(ctx, buildErrorRedirect, ctx.query.code)
          const { accessToken, refreshToken, openid, scope, expiresIn } = ensureTokenFields(
            ctx,
            buildErrorRedirect,
            tokenData
          )

          // 2. 获取用户信息
          const profile = await fetchUserProfile(ctx, buildErrorRedirect, accessToken, openid)
          const id = profile.unionid || profile.openid || openid

          if (debug) {
            console.log('[WeChat OAuth] Profile:', {
              id,
              nickname: profile.nickname,
              hasUnionId: !!profile.unionid,
            })
          }

          // 3. 查找或创建用户
          const { user } = await upsertOAuthUser({
            ctx,
            buildErrorRedirect,
            profile,
            providerUserId: id.toString(),
            openid,
            accessToken,
            refreshToken,
            expiresIn,
            scope,
          })

          if (!user) {
            throw ctx.redirect(buildErrorRedirect('user_not_found'))
          }

          // 4. 创建 session
          const session = await ctx.context.internalAdapter.createSession(user.id)
          if (!session) {
            throw ctx.redirect(buildErrorRedirect('unable_to_create_session'))
          }

          await setSessionCookie(ctx, { session, user })
          const redirectTo = callbackURL
          if (debug) {
            console.log('[WeChat OAuth] Success, redirecting to:', redirectTo)
          }
          throw ctx.redirect(redirectTo)
        }
      ),
    },
  }
}
