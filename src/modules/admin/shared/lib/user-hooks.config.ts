/**
 * 用户创建钩子配置
 *
 * 在此添加需要在用户创建时触发的子模块钩子
 * 每个模块应该导出一个 `register` 函数用于注册钩子
 */
export const USER_HOOK_MODULES = [
    // payment 模块：创建用户时初始化支付账户（示例）
    // '../../../payment/shared/services/user-hook',

    // 添加更多子模块...
] as const
