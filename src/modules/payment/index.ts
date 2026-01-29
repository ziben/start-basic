/**
 * Payment Module Exports
 */

// Types
export * from './shared/types'

// Server Functions
export {
    createPrepayOrderFn,
    queryOrderStatusFn,
    syncOrderStatusFn,
    closeOrderFn,
} from './shared/server-fns/prepay'
export { handleWeChatPayNotify, verifyWeChatPaySignature } from './shared/server-fns/notify'

// WeChat Pay Client
export {
    getWeChatPayClient,
    getWeChatPayConfig,
    resetWeChatPayClient,
    WeChatPayClient,
    type WeChatPayConfig,
    type JSAPIPayParams,
    type NativePayParams,
    type WeChatPayNotification,
    type PaymentResult,
    type JSAPIPaymentParams,
} from './shared/lib/wechat-pay'
