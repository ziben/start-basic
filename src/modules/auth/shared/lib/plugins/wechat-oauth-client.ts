/**
 * WeChat OAuth Client Plugin for Better Auth
 * 自动推断服务端插件的类型
 */

import type { BetterAuthClientPlugin } from 'better-auth/client'
import type { wechatOAuth } from './wechat-oauth'

export const wechatOAuthClient = (): BetterAuthClientPlugin => {
  return {
    id: 'wechat-oauth',
    $InferServerPlugin: {} as ReturnType<typeof wechatOAuth>,
    getActions: ($fetch) => ({
      signIn: {
        wechat: async (data: {
          callbackURL?: string
          errorCallbackURL?: string
          newUserCallbackURL?: string
          disableRedirect?: boolean
        }) => {
          return await $fetch('/sign-in/wechat', {
            method: 'POST',
            body: data,
          })
        },
      },
    }),
  }
}
