/**
 * Payment Hooks - 支付成功后的回调机制
 *
 * 允许子模块注册自己的充值成功处理逻辑，
 * payment 模块不直接耦合业务模块。
 */

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

  // 注册 zc 模块的充值成功回调
  const { registerZcPaymentHook } = await import('../../../zc/shared/services/payment-hook')
  await registerZcPaymentHook()
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
