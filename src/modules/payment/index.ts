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

// Server Functions (通过 createServerFn 包装，Vite 会 tree-shake 服务端代码)
export {
    createPrepayOrderFn,
    queryOrderStatusFn,
    syncOrderStatusFn,
    closeOrderFn,
} from './shared/server-fns/prepay'
export { handleWeChatPayNotify, verifyWeChatPaySignature } from './shared/server-fns/notify'
