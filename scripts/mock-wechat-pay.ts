/**
 * 微信支付模拟器 (仅用于开发环境)
 *
 * 用法: pnpm exec tsx scripts/mock-wechat-pay.ts <商户订单号>
 *
 * 该脚本会绕过微信签名验证，直接在数据库中将订单标记为支付成功，
 * 并触发相关的业务逻辑。
 */

import { resolve } from 'node:path'
import { getDb } from '../src/shared/lib/db'
import { onPaymentSuccess } from '../src/modules/payment/shared/server-fns/notify'

// 获取命令行参数
const outTradeNo = process.argv[2]

if (!outTradeNo) {
    console.error('❌ 请提供商户订单号 (outTradeNo)')
    console.log('用法: pnpm exec tsx scripts/mock-wechat-pay.ts <outTradeNo>')
    process.exit(1)
}

async function mockNotify() {
    console.log(`🚀 正在模拟订单支付成功: ${outTradeNo}...`)

    const prisma = await getDb()

    // 1. 查找订单
    const order = await prisma.paymentOrder.findUnique({
        where: { outTradeNo },
    })

    if (!order) {
        console.error(`❌ 找不到订单: ${outTradeNo}`)
        process.exit(1)
    }

    if (order.status === 'SUCCESS') {
        console.warn(`⚠️ 订单已经是成功状态，跳过处理。`)
        process.exit(0)
    }

    // 2. 模拟支付成功更新
    const transactionId = `MOCK_WX_${Date.now()}`
    const paidAt = new Date()

    try {
        await prisma.$transaction(async (tx) => {
            // 更新订单详情
            const updatedOrder = await tx.paymentOrder.update({
                where: { id: order.id },
                data: {
                    status: 'SUCCESS',
                    transactionId,
                    paidAt,
                },
            })

            console.log('✅ 数据库订单状态已更新为 SUCCESS')

            // 3. 触发业务逻辑
            console.log(`[WeChatPay Mock] Triggering post-payment logic for order: ${order.id}`)
            await onPaymentSuccess(order.id, {
                out_trade_no: outTradeNo,
                transaction_id: transactionId,
                trade_state: 'SUCCESS',
                success_time: paidAt.toISOString(),
                amount: {
                    total: order.amount,
                    payer_total: order.amount,
                    currency: 'CNY',
                    payer_currency: 'CNY',
                },
            })
        })

        console.log('\n🎉 模拟支付处理完成！')
        console.log('订单号:', outTradeNo)
        console.log('支付金额 (分):', order.amount)
        console.log('交易单号:', transactionId)
        console.log('支付时间:', paidAt.toLocaleString())

    } catch (error) {
        console.error('❌ 模拟失败:', error)
        process.exit(1)
    }
}

mockNotify()
    .catch(console.error)
    .finally(() => process.exit())
