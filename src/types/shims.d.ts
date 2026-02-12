/**
 * TypeScript Shims and Type Augmentations
 *
 * 这个文件定义了第三方库的类型补充和全局类型扩展
 * 仅包含必要的类型声明，官方已提供类型的库不再重复声明
 */

// ============================================================================
// Asset Imports
// ============================================================================

/**
 * SVG文件模块声明
 * 允许在 TypeScript 中导入 .svg 文件
 */
declare module '*.svg' {
  const content: string
  export default content
}

// ============================================================================
// Better Auth Extensions
// ============================================================================

/**
 * Better Auth Cookie 工具函数扩展
 * 补充 better-auth/cookies 模块的类型定义
 */
declare module 'better-auth/cookies' {
  import type { GenericEndpointContext, Session, User } from 'better-auth'

  /**
   * 设置会话Cookie
   * @param ctx - 端点上下文
   * @param session - 会话和用户信息
   * @param dontRememberMe - 是否不记住登录状态
   * @param overrides - Cookie覆盖选项
   */
  export function setSessionCookie(
    ctx: GenericEndpointContext,
    session: {
      session: Session & Record<string, unknown>
      user: User
    },
    dontRememberMe?: boolean,
    overrides?: Record<string, unknown>
  ): Promise<void>
}

// ============================================================================
// Third-Party SDKs
// ============================================================================

/**
 * 微信JS-SDK Bridge接口
 * 用于微信内置浏览器的原生功能调用
 */
interface WeixinJSBridgeInstance {
  /**
   * 调用微信原生API
   * @param api - API名称
   * @param params - 参数对象
   * @param callback - 回调函数
   */
  invoke(
    api: string,
    params: Record<string, unknown>,
    callback: (res: { err_msg: string }) => void
  ): void

  /**
   * 监听微信事件
   * @param event - 事件名称
   * @param callback - 事件回调
   */
  on(event: string, callback: (res: unknown) => void): void

  /**
   * 直接调用微信API（无回调）
   * @param api - API名称
   * @param params - 可选参数
   */
  call(api: string, params?: Record<string, unknown>): void
}

// ============================================================================
// Global Type Augmentations
// ============================================================================

declare global {
  /**
   * 微信JS-SDK Bridge全局对象
   * 仅在微信内置浏览器中可用
   */
  var WeixinJSBridge: WeixinJSBridgeInstance | undefined

  interface Window {
    wx?: {
      config: (options: {
        debug: boolean
        appId: string
        timestamp: number
        nonceStr: string
        signature: string
        jsApiList: string[]
      }) => void
      ready: (callback: () => void) => void
      error: (callback: (err: unknown) => void) => void
      updateAppMessageShareData?: (options: {
        title: string
        desc: string
        link: string
        imgUrl: string
      }) => void
      updateTimelineShareData?: (options: {
        title: string
        link: string
        imgUrl: string
      }) => void
      onMenuShareAppMessage?: (options: {
        title: string
        desc: string
        link: string
        imgUrl: string
      }) => void
      onMenuShareTimeline?: (options: {
        title: string
        link: string
        imgUrl: string
      }) => void
    }
  }
}

// 必须导出以使其成为模块
export { }
