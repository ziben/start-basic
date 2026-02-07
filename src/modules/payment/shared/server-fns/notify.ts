/**
 * 微信支付回调处理
 *
 * 用于接收微信支付的异步通知
 * 需要配合 API Route 使用
 */

import {
    type WeChatPayNotification,
    type PaymentResult,
} from '../lib/wechat-pay'

/**
 * 处理微信支付回调通知
 *
 * @param notification - 微信推送的通知数据
 * @returns 处理结果
 */
export async function handleWeChatPayNotify(
    notification: WeChatPayNotification
): Promise<{ code: 'SUCCESS' | 'FAIL'; message: string }> {
    const { getDb } = await import('../../../../shared/lib/db')
    const prisma = await getDb()
    const { getWeChatPayClient } = await import('../lib/wechat-pay')
    const client = await getWeChatPayClient()

    try {
        // 解密通知数据
        const paymentResult: PaymentResult = await client.decryptNotification(notification)

        console.log('[WeChatPay Notify] Received payment result:', {
            out_trade_no: paymentResult.out_trade_no,
            trade_state: paymentResult.trade_state,
            transaction_id: paymentResult.transaction_id,
        })

        // 查找订单
        const order = await prisma.paymentOrder.findUnique({
            where: { outTradeNo: paymentResult.out_trade_no },
        })

        if (!order) {
            console.error('[WeChatPay Notify] Order not found:', paymentResult.out_trade_no)
            return { code: 'FAIL', message: '订单不存在' }
        }

        // 检查订单状态，避免重复处理
        if (order.status === 'SUCCESS') {
            console.log('[WeChatPay Notify] Order already paid:', order.outTradeNo)
            return { code: 'SUCCESS', message: '已处理' }
        }

        // 验证金额是否一致 (防止金额篡改)
        if (paymentResult.amount.total !== order.amount) {
            console.error('[WeChatPay Notify] Amount mismatch:', {
                expected: order.amount,
                received: paymentResult.amount.total,
            })
            return { code: 'FAIL', message: '金额不一致' }
        }

        // 根据支付状态更新订单
        if (paymentResult.trade_state === 'SUCCESS') {
            await prisma.paymentOrder.update({
                where: { id: order.id },
                data: {
                    status: 'SUCCESS',
                    transactionId: paymentResult.transaction_id,
                    paidAt: new Date(paymentResult.success_time),
                },
            })

            console.log('[WeChatPay Notify] Order paid successfully:', order.outTradeNo)

            await onPaymentSuccess(order.id, paymentResult)

            return { code: 'SUCCESS', message: '成功' }
        } else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(paymentResult.trade_state)) {
            await prisma.paymentOrder.update({
                where: { id: order.id },
                data: { status: 'FAILED' },
            })

            console.log(
                '[WeChatPay Notify] Order failed:',
                order.outTradeNo,
                paymentResult.trade_state
            )

            return { code: 'SUCCESS', message: '成功' }
        }

        // 其他状态（如 USERPAYING）暂不处理
        return { code: 'SUCCESS', message: '成功' }
    } catch (error) {
        console.error('[WeChatPay Notify] Error processing notification:', error)
        return { code: 'FAIL', message: '处理失败' }
    }
}

/**
 * 验证微信支付回调签名
 *
 * @param headers - 请求头
 * @param body - 请求体原文
 * @returns 是否验证通过
 */
export async function verifyWeChatPaySignature(
    headers: Record<string, string | undefined>,
    body: string
): Promise<boolean> {
    const { getWeChatPayClient } = await import('../lib/wechat-pay')
    const client = await getWeChatPayClient()

    const timestamp = headers['wechatpay-timestamp']
    const nonce = headers['wechatpay-nonce']
    const signature = headers['wechatpay-signature']
    const serial = headers['wechatpay-serial']

    if (!timestamp || !nonce || !signature || !serial) {
        console.error('[WeChatPay] Missing required headers for signature verification')
        return false
    }

    try {
        return await client.verifySignature({
            timestamp,
            nonce,
            body,
            signature,
            serial,
        })
    } catch (error) {
        console.error('[WeChatPay] Signature verification failed:', error)
        return false
    }
}

/**
 * 支付成功后的业务处理
 *
 * 通过 hook 机制触发子模块的回调逻辑，
 * payment 模块不直接耦合业务模块。
 */
export async function onPaymentSuccess(orderId: string, _result: Partial<PaymentResult>): Promise<void> {
    const { getDb } = await import('../../../../shared/lib/db')
    const prisma = await getDb()

    const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        select: { userId: true, amount: true, status: true, outTradeNo: true, transactionId: true, paidAt: true },
    })

    if (!order) {
        console.error('[WeChatPay Biz] onPaymentSuccess: order not found', orderId)
        return
    }

    // 触发所有注册的充值成功回调
    const { firePaymentSuccessHooks } = await import('../lib/payment-hooks')
    await firePaymentSuccessHooks({
        orderId,
        userId: order.userId,
        amount: order.amount,
        outTradeNo: order.outTradeNo,
        transactionId: order.transactionId ?? undefined,
        paidAt: order.paidAt ?? undefined,
    })

    console.log('[WeChatPay Biz] onPaymentSuccess: hooks fired', {
        orderId,
        userId: order.userId,
        amount: order.amount,
    })
}
