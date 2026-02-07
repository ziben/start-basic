/**
 * User Creation Hooks - 用户创建后的回调机制
 *
 * 允许子模块注册自己的用户创建处理逻辑，
 * admin 模块不直接耦合业务模块。
 *
 * 参考 payment 模块的钩子机制设计
 */

import { USER_HOOK_MODULES } from './user-hooks.config'

export interface UserCreatedContext {
    userId: string
    email: string
    name: string
    username?: string
    role?: string
    createdAt: Date
}

type UserCreatedHandler = (ctx: UserCreatedContext) => Promise<void>

const handlers: { name: string; handler: UserCreatedHandler }[] = []

/**
 * 注册用户创建成功回调
 */
export function onUserCreatedHook(name: string, handler: UserCreatedHandler) {
    // 防止重复注册
    if (handlers.some((h) => h.name === name)) return
    handlers.push({ name, handler })
    console.log(`[UserHooks] Registered handler: ${name}`)
}

let initialized = false

/**
 * 确保所有子模块的 hook 已注册（惰性初始化，只执行一次）
 */
async function ensureHooksRegistered() {
    if (initialized) return
    initialized = true

    // 从配置文件动态加载所有子模块钩子
    for (const modulePath of USER_HOOK_MODULES) {
        try {
            const module = await import(modulePath)
            if (typeof module.register === 'function') {
                await module.register()
            } else {
                console.warn(`[UserHooks] Module ${modulePath} does not export a register function`)
            }
        } catch (error) {
            console.error(`[UserHooks] Failed to load module: ${modulePath}`, error)
            // 不中断其他模块加载
        }
    }
}

/**
 * 触发所有用户创建成功回调
 */
export async function fireUserCreatedHooks(ctx: UserCreatedContext) {
    await ensureHooksRegistered()

    for (const { name, handler } of handlers) {
        try {
            await handler(ctx)
            console.log(`[UserHooks] Handler "${name}" executed successfully`)
        } catch (error) {
            console.error(`[UserHooks] Handler "${name}" failed:`, error)
            // 不中断其他 handler
        }
    }
}
