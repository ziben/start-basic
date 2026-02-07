/**
 * 用户创建钩子插件
 *
 * 拦截 better-auth 的用户注册流程，在用户创建后触发钩子
 */
import type { BetterAuthPlugin } from 'better-auth'

export function userCreatedPlugin(): BetterAuthPlugin {
    return {
        id: 'user-created-hooks',
        hooks: {
            after: [
                {
                    matcher(context) {
                        // 拦截注册端点
                        return context.path === '/sign-up/email'
                    },
                    async handler(context) {
                        // 检查是否有用户数据返回
                        // @ts-expect-error - __return_val__ is not typed in better-auth
                        const returnValue = context.__return_val__ as any
                        if (!returnValue?.user) return

                        const user = returnValue.user

                        try {
                            const { fireUserCreatedHooks } = await import('../../../../admin/shared/lib/user-hooks')
                            await fireUserCreatedHooks({
                                userId: user.id,
                                email: user.email,
                                name: user.name,
                                username: user.username ?? undefined,
                                role: user.role ?? undefined,
                                createdAt: new Date(user.createdAt),
                            })
                        } catch (err) {
                            console.error('[Auth] User created hook failed:', err)
                            // 不影响注册流程
                        }
                    },
                },
            ],
        },
    }
}
