/**
 * Payment Module Types
 */

// 支付状态
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CLOSED'

// 支付方式
export type PaymentMethod = 'WECHAT_JSAPI' | 'WECHAT_NATIVE' | 'WECHAT_H5' | 'ALIPAY'

// 创建订单请求
export interface CreateOrderRequest {
    userId: string
    amount: number // 单位：分
    description: string
    paymentMethod: PaymentMethod
    metadata?: Record<string, unknown>
}

// 订单信息
export interface OrderInfo {
    id: string
    userId: string
    outTradeNo: string
    transactionId?: string
    amount: number
    status: PaymentStatus
    description: string
    paymentMethod: PaymentMethod
    createdAt: Date
    paidAt?: Date
    metadata?: Record<string, unknown>
}

// 支付结果
export interface PaymentCallbackResult {
    success: boolean
    outTradeNo: string
    transactionId?: string
    paidAt?: Date
    errorMessage?: string
}
