import { createAuthClient } from 'better-auth/client'
import {
  adminClient,
  usernameClient,
  organizationClient,
} from 'better-auth/client/plugins'
import { wechatOAuthClient } from './plugins/wechat-oauth-client'

/**
 * Better-Auth 客户端配置
 *
 * 注意：客户端不需要完整的 access control 配置
 * 权限检查在服务端进行
 */
export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient(),
    organizationClient({
      teams: {
        enabled: false, // 禁用 teams，使用 OrganizationRole
      },
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    wechatOAuthClient(), // 微信 OAuth 登录
  ],
})

