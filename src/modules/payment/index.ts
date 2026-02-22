/**
 * Payment Module Exports
 *
 * 注意：服务端专用代码（WeChatPayClient、getWeChatPayClient 等）
 * 请直接从 './shared/lib/wechat-pay' 导入，不通过此 barrel 暴露，
 * 避免客户端打包时拉入 node:fs 等 Node.js 依赖。
 */

// Types (安全：纯类型，不含运行时代码)
export * from './shared/types'
export type {
    WeChatPayConfig,
    JSAPIPayParams,
    NativePayParams,
    WeChatPayNotification,
    PaymentResult,
    JSAPIPaymentParams,
    WxPayJSAPIResponse,
} from './shared/lib/wechat-pay'

// Server Functions have been removed to prevent backend leak in barrel file.
// Import them directly from './shared/server-fns/prepay' or './shared/server-fns/notify' when needed.
