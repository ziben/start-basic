import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PrepayRequestSchema } from '../schemas/prepay'
import { createPrepayOrder } from '../services/create-prepay-order.service'

export async function handleCreatePrepayOrder(
    data: z.infer<typeof PrepayRequestSchema>,
    headers: Headers,
) {
    const { auth } = await import('../../../auth/shared/lib/auth')
    const { getDb } = await import('~/shared/lib/db')
    const { getWeChatPayClient } = await import('../lib/wechat-pay')

    const session = await auth.api.getSession({ headers })
    const prisma = await getDb()
    const wechatPayClient = await getWeChatPayClient()

    return createPrepayOrder(data, {
        sessionUserId: session?.user?.id ?? null,
        notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
        prisma,
        wechatPayClient,
    })
}

export const createPrepayOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => PrepayRequestSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof PrepayRequestSchema> }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const { headers } = getRequest()!
        return handleCreatePrepayOrder(data, headers)
    })

/**
 * 查询订单状态
 */
export const queryOrderStatusFn = createServerFn({ method: 'GET' })
    .inputValidator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const { auth } = await import('../../../auth/shared/lib/auth')
        const { getDb } = await import('~/shared/lib/db')

        const { headers } = getRequest()!
        const session = await auth.api.getSession({ headers })
        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        const prisma = await getDb()
        const order = await prisma.paymentOrder.findUnique({
            where: { id: data.orderId },
            select: {
                id: true,
                userId: true,
                outTradeNo: true,
                transactionId: true,
                amount: true,
                status: true,
                description: true,
                paymentMethod: true,
                createdAt: true,
                paidAt: true,
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.userId !== session.user.id) {
            throw new Error('Forbidden')
        }

        const { userId: _, ...orderWithoutUserId } = order
        return orderWithoutUserId
    })

/**
 * 主动查询微信支付订单状态 (用于客户端轮询)
 */
export const syncOrderStatusFn = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const { auth } = await import('../../../auth/shared/lib/auth')
        const { getDb } = await import('~/shared/lib/db')

        const { headers } = getRequest()!
        const session = await auth.api.getSession({ headers })
        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        const prisma = await getDb()
        const order = await prisma.paymentOrder.findUnique({
            where: { id: data.orderId },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.userId !== session.user.id) {
            throw new Error('Forbidden')
        }

        // 如果订单已完成，直接返回
        if (order.status === 'SUCCESS' || order.status === 'REFUNDED') {
            return { status: order.status, transactionId: order.transactionId }
        }

        try {
            // 查询微信支付订单状态
            const { getWeChatPayClient } = await import('../lib/wechat-pay')
            const client = await getWeChatPayClient()
            const result = await client.queryOrderByOutTradeNo(order.outTradeNo)

            if (result.trade_state === 'SUCCESS') {
                // 更新本地订单
                await prisma.paymentOrder.update({
                    where: { id: order.id },
                    data: {
                        status: 'SUCCESS',
                        transactionId: result.transaction_id,
                        paidAt: new Date(result.success_time),
                    },
                })

                // 触发业务逻辑：给用户加余额
                const { onPaymentSuccess } = await import('./notify')
                await onPaymentSuccess(order.id, result)

                return {
                    status: 'SUCCESS',
                    transactionId: result.transaction_id,
                }
            } else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(result.trade_state)) {
                await prisma.paymentOrder.update({
                    where: { id: order.id },
                    data: { status: 'FAILED' },
                })

                return { status: 'FAILED', message: result.trade_state_desc }
            }

            return { status: 'PENDING', message: result.trade_state_desc }
        } catch (error) {
            console.error('[WeChatPay] Query order failed:', error)
            return { status: 'UNKNOWN', message: 'Failed to query order status' }
        }
    })

/**
 * 关闭订单 (取消支付)
 */
export const closeOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const { auth } = await import('../../../auth/shared/lib/auth')
        const { getDb } = await import('~/shared/lib/db')

        const { headers } = getRequest()!
        const session = await auth.api.getSession({ headers })
        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        const prisma = await getDb()
        const order = await prisma.paymentOrder.findUnique({
            where: { id: data.orderId },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.userId !== session.user.id) {
            throw new Error('Forbidden')
        }

        if (order.status !== 'PENDING') {
            throw new Error('Only pending orders can be closed')
        }

        try {
            const { getWeChatPayClient } = await import('../lib/wechat-pay')
            const client = await getWeChatPayClient()
            await client.closeOrder(order.outTradeNo)

            await prisma.paymentOrder.update({
                where: { id: order.id },
                data: { status: 'CLOSED' },
            })

            return { success: true }
        } catch (error) {
            console.error('[WeChatPay] Close order failed:', error)
            throw new Error('Failed to close order')
        }
    })
