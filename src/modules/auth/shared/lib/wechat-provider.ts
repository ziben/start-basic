/**
 * WeChat OAuth Provider for Better-Auth
 *
 * 支持两种登录场景：
 * 1. PC 端扫码登录 (微信开放平台)
 * 2. 微信内 H5 授权登录 (微信公众平台)
 *
 * 使用前请确保已在 .env 中配置：
 * - WECHAT_APP_ID
 * - WECHAT_APP_SECRET
 */

// 微信 OAuth 配置
export interface WeChatConfig {
    appId: string
    appSecret: string
    // PC 扫码登录使用 open.weixin.qq.com
    // H5 授权登录使用 open.weixin.qq.com (公众号需要配置域名)
    scope?: 'snsapi_login' | 'snsapi_userinfo' | 'snsapi_base'
}

// 微信用户信息
export interface WeChatUserInfo {
    openid: string
    unionid?: string
    nickname: string
    sex: number
    province: string
    city: string
    country: string
    headimgurl: string
    privilege: string[]
}

// 微信 Token 响应
interface WeChatTokenResponse {
    access_token: string
    expires_in: number
    refresh_token: string
    openid: string
    scope: string
    unionid?: string
    errcode?: number
    errmsg?: string
}

/**
 * 获取微信授权 URL (PC 扫码登录)
 */
export function getWeChatAuthorizationUrl(
    config: WeChatConfig,
    redirectUri: string,
    state: string
): string {
    const params = new URLSearchParams({
        appid: config.appId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope || 'snsapi_login',
        state,
    })

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

/**
 * 获取微信授权 URL (H5 静默/授权登录)
 */
export function getWeChatH5AuthorizationUrl(
    config: WeChatConfig,
    redirectUri: string,
    state: string
): string {
    const params = new URLSearchParams({
        appid: config.appId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope || 'snsapi_userinfo',
        state,
    })

    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`
}

/**
 * 用授权码换取 Access Token
 */
export async function exchangeCodeForToken(
    config: WeChatConfig,
    code: string
): Promise<WeChatTokenResponse> {
    const params = new URLSearchParams({
        appid: config.appId,
        secret: config.appSecret,
        code,
        grant_type: 'authorization_code',
    })

    const response = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`
    )

    const data = (await response.json()) as WeChatTokenResponse

    if (data.errcode) {
        throw new Error(`WeChat OAuth error: ${data.errmsg} (${data.errcode})`)
    }

    return data
}

/**
 * 获取微信用户信息
 */
export async function getWeChatUserInfo(
    accessToken: string,
    openid: string
): Promise<WeChatUserInfo> {
    const params = new URLSearchParams({
        access_token: accessToken,
        openid,
        lang: 'zh_CN',
    })

    const response = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?${params.toString()}`
    )

    const data = (await response.json()) as WeChatUserInfo & { errcode?: number; errmsg?: string }

    if (data.errcode) {
        throw new Error(`WeChat userinfo error: ${data.errmsg} (${data.errcode})`)
    }

    return data
}

/**
 * 生成合成邮箱 (微信不提供邮箱，需要生成一个占位符)
 */
export function generateSyntheticEmail(openid: string): string {
    return `${openid}@wechat.placeholder`
}

/**
 * 获取默认配置
 */
export function getWeChatConfig(): WeChatConfig {
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET

    if (!appId || !appSecret) {
        throw new Error('Missing WECHAT_APP_ID or WECHAT_APP_SECRET in environment variables')
    }

    return {
        appId,
        appSecret,
        scope: 'snsapi_login',
    }
}
