/**
 * Payment Success Hooks 配置
 *
 * 在此添加需要在支付成功时触发的子模块钩子
 * 每个模块导出一个 `register` 函数用于注册钩子
 *
 * 使用静态导入而非动态路径字符串，确保打包器能正确处理依赖
 */
// import { register as registerZcHook } from '../../../zc/shared/services/payment-hook'

export const PAYMENT_HOOK_REGISTRARS: Array<{
    name: string
    register: () => Promise<void>
}> = [
        // zc 模块：支付成功后处理充值逻辑
        // { name: 'zc-recharge', register: registerZcHook },

        // 添加更多子模块...
    ]
