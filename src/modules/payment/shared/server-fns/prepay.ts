/**
 * 创建预支付订单 Server Function
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// 请求参数校验
const prepaySchema = z.object({
    amount: z.number().int().positive(),
    description: z.string().min(1).max(127),
    paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5']),
    openid: z.string().optional(), // JSAPI 必须
    attach: z.string().optional(), // 附加数据
})

/**
 * 创建微信支付预订单
 */
export const createPrepayOrderFn = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => prepaySchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof prepaySchema> }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const { auth } = await import('../../../auth/shared/lib/auth')
        const { getDb } = await import('../../../../shared/lib/db')

        // 获取当前用户
        const { headers } = getRequest()!
        const session = await auth.api.getSession({ headers })

        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        const prisma = await getDb()
        const { getWeChatPayClient } = await import('../lib/wechat-pay')
        const client = await getWeChatPayClient()

        // 生成商户订单号 (格式: 时间戳 + 随机字符)
        const outTradeNo = `${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        // 创建数据库订单记录
        const order = await prisma.paymentOrder.create({
            data: {
                userId: session.user.id,
                outTradeNo,
                amount: data.amount,
                description: data.description,
                paymentMethod: data.paymentMethod,
                status: 'PENDING',
                metadata: data.attach ? { attach: data.attach } : undefined,
            },
        })

        try {
            // 根据支付方式调用不同的 API
            if (data.paymentMethod === 'WECHAT_NATIVE') {
                // PC 扫码支付
                const result = await client.transactionsNative({
                    description: data.description,
                    out_trade_no: outTradeNo,
                    notify_url: process.env.WECHAT_PAY_NOTIFY_URL!,
                    amount: { total: data.amount, currency: 'CNY' },
                    attach: data.attach,
                })

                return {
                    orderId: order.id,
                    outTradeNo,
                    codeUrl: result.code_url, // 用于生成二维码
                }
            } else {
                // JSAPI 支付 (公众号/小程序)
                // 优先使用前端传入的 openid，否则从 account 表查（idToken 字段存储了 openid）
                let openid = data.openid
                if (!openid) {
                    const wechatAccount = await prisma.account.findFirst({
                        where: { userId: session.user.id, providerId: 'wechat' },
                        select: { idToken: true },
                    })
                    openid = wechatAccount?.idToken ?? undefined
                }
                if (!openid) {
                    throw new Error('openid is required for JSAPI payment')
                }

                const result = await client.transactionsJSAPI({
                    description: data.description,
                    out_trade_no: outTradeNo,
                    notify_url: process.env.WECHAT_PAY_NOTIFY_URL!,
                    amount: { total: data.amount, currency: 'CNY' },
                    payer: { openid },
                    attach: data.attach,
                })

                // SDK 返回 { status, data: { appId, timeStamp, nonceStr, package, signType, paySign } }
                const jsapiData = result.data || result
                const jsapiParams = {
                    appId: jsapiData.appId,
                    timeStamp: jsapiData.timeStamp,
                    nonceStr: jsapiData.nonceStr,
                    package: jsapiData.package,
                    signType: jsapiData.signType || 'RSA' as const,
                    paySign: jsapiData.paySign,
                }

                return {
                    orderId: order.id,
                    outTradeNo,
                    prepayId: jsapiData.package?.replace('prepay_id=', ''),
                    jsapiParams,
                }
            }
        } catch (error) {
            // 支付请求失败，更新订单状态
            await prisma.paymentOrder.update({
                where: { id: order.id },
                data: { status: 'FAILED' },
            })

            console.error('[WeChatPay] Prepay failed:', error)
            throw new Error(
                `Payment request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
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
