/**
 * Payment 模块用户创建钩子示例
 *
 * 当新用户创建时，自动为其初始化 payment 模块的相关数据
 */

import { onUserCreatedHook, type UserCreatedContext } from '../../../admin/shared/lib/user-hooks'

/**
 * 注册 payment 模块的用户创建钩子
 */
export async function register() {
    onUserCreatedHook('payment:initUserAccount', async (ctx: UserCreatedContext) => {
        const { getDb } = await import('../../../../shared/lib/db')
        const prisma = await getDb()

        // 示例：为新用户创建 payment 账户或初始化数据
        // 根据实际业务需求调整
        console.log(`[Payment Hook] Initializing payment data for user: ${ctx.userId}`)

        // 示例代码（取决于实际的数据库schema）：
        // await prisma.paymentAccount.create({
        //   data: {
        //     userId: ctx.userId,
        //     balance: 0,
        //   },
        // })

        // 或者记录日志、发送通知等
        console.log(`[Payment Hook] User ${ctx.email} payment account initialized`)
    })
}
