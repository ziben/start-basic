/**
 * Payment Success Hooks 配置
 *
 * 在此添加需要在支付成功时触发的子模块钩子
 * 每个模块应该导出一个 `register` 函数用于注册钩子
 */
export const PAYMENT_HOOK_MODULES = [
    // zc 模块：支付成功后处理充值逻辑
    // '../../../zc/shared/services/payment-hook',

    // 添加更多子模块...
] as const
