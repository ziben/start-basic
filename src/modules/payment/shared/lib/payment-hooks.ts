/**
 * Payment Hooks - 支付成功后的回调机制
 *
 * 允许子模块注册自己的充值成功处理逻辑，
 * payment 模块不直接耦合业务模块。
 */

import { PAYMENT_HOOK_MODULES } from './payment-hooks.config'

export interface PaymentSuccessContext {
  orderId: string
  userId: string
  amount: number // 单位：分
  outTradeNo: string
  transactionId?: string
  paidAt?: Date
}

type PaymentSuccessHandler = (ctx: PaymentSuccessContext) => Promise<void>

const handlers: { name: string; handler: PaymentSuccessHandler }[] = []

/**
 * 注册充值成功回调
 */
export function onPaymentSuccessHook(name: string, handler: PaymentSuccessHandler) {
  // 防止重复注册
  if (handlers.some((h) => h.name === name)) return
  handlers.push({ name, handler })
  console.log(`[PaymentHooks] Registered handler: ${name}`)
}

let initialized = false

/**
 * 确保所有子模块的 hook 已注册（惰性初始化，只执行一次）
 */
async function ensureHooksRegistered() {
  if (initialized) return
  initialized = true

  // 从配置文件动态加载所有子模块钩子
  for (const modulePath of PAYMENT_HOOK_MODULES) {
    try {
      const module = await import(modulePath)
      if (typeof module.register === 'function') {
        await module.register()
      } else {
        console.warn(`[PaymentHooks] Module ${modulePath} does not export a register function`)
      }
    } catch (error) {
      console.error(`[PaymentHooks] Failed to load module: ${modulePath}`, error)
      // 不中断其他模块加载
    }
  }
}

/**
 * 触发所有充值成功回调
 */
export async function firePaymentSuccessHooks(ctx: PaymentSuccessContext) {
  await ensureHooksRegistered()

  for (const { name, handler } of handlers) {
    try {
      await handler(ctx)
      console.log(`[PaymentHooks] Handler "${name}" executed successfully`)
    } catch (error) {
      console.error(`[PaymentHooks] Handler "${name}" failed:`, error)
      // 不中断其他 handler
    }
  }
}
