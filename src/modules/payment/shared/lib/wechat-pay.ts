/**
 * WeChat Pay SDK 封装 (API v3)
 *
 * 基于 wechatpay-node-v3 库实现
 * 安装依赖: pnpm add wechatpay-node-v3
 *
 * 环境变量配置：
 * - WECHAT_APP_ID (公众号/小程序 appid)
 * - WECHAT_PAY_MCH_ID (商户号)
 * - WECHAT_PAY_API_V3_KEY (API v3 密钥)
 * - WECHAT_PAY_PRIVATE_KEY_PATH (商户证书私钥路径)
 * - WECHAT_PAY_PUBLIC_KEY_PATH (商户证书公钥路径)
 * - WECHAT_PAY_NOTIFY_URL (支付回调通知地址)
 *
 * @see https://github.com/klover2/wechatpay-node-v3-ts
 * @see https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml
 */

// node:fs / node:path 仅在服务端使用，延迟加载避免客户端打包报错

// 微信支付配置
export interface WeChatPayConfig {
    appid: string
    mchid: string
    publicKey: Buffer // 公钥证书
    privateKey: Buffer // 私钥
    key: string // API v3 密钥
    notifyUrl: string
}

// 预支付订单请求 (JSAPI)
export interface JSAPIPayParams {
    description: string
    out_trade_no: string
    notify_url: string
    amount: {
        total: number // 单位：分
        currency?: string
    }
    payer: {
        openid: string
    }
    time_expire?: string
    attach?: string
    goods_tag?: string
    support_fapiao?: boolean
}

// Native 支付请求
export interface NativePayParams {
    description: string
    out_trade_no: string
    notify_url: string
    amount: {
        total: number
        currency?: string
    }
    time_expire?: string
    attach?: string
}

// 支付通知数据 (微信推送的原始格式)
export interface WeChatPayNotification {
    id: string
    create_time: string
    event_type: string
    resource_type: string
    resource: {
        algorithm: string
        ciphertext: string
        associated_data: string
        nonce: string
        original_type: string
    }
    summary: string
}

// 解密后的支付结果
export interface PaymentResult {
    mchid: string
    appid: string
    out_trade_no: string
    transaction_id: string
    trade_type: 'JSAPI' | 'NATIVE' | 'APP' | 'MICROPAY' | 'MWEB' | 'FACEPAY'
    trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR'
    trade_state_desc: string
    bank_type: string
    success_time: string
    payer: {
        openid: string
    }
    amount: {
        total: number
        payer_total: number
        currency: string
        payer_currency: string
    }
    attach?: string
}

// JSAPI 调起支付参数
export interface JSAPIPaymentParams {
    appId: string
    timeStamp: string
    nonceStr: string
    package: string
    signType: 'RSA'
    paySign: string
}

// SDK transactions_jsapi 返回类型
export interface WxPayJSAPIResponse {
    status: number
    data: JSAPIPaymentParams
}

let wechatPayInstance: WeChatPayClient | null = null

/**
 * 微信支付客户端
 *
 * 封装 wechatpay-node-v3 SDK
 */
export class WeChatPayClient {
    private pay: any // WxPay instance
    private config: WeChatPayConfig

    constructor(config: WeChatPayConfig) {
        this.config = config
    }

    private async initWxPay() {
        try {
            // 动态导入 wechatpay-node-v3
            const WxPay = (await import('wechatpay-node-v3')).default
            this.pay = new WxPay({
                appid: this.config.appid,
                mchid: this.config.mchid,
                publicKey: this.config.publicKey,
                privateKey: this.config.privateKey,
                key: this.config.key,
            })
        } catch (error) {
            console.error('[WeChatPay] Failed to initialize WxPay:', error)
            throw error
        }
    }

    /**
     * 确保 WxPay 实例已初始化
     */
    private async ensurePay(): Promise<any> {
        if (!this.pay) {
            await this.initWxPay()
        }
        return this.pay
    }

    /**
     * JSAPI 下单 (用于公众号/小程序支付)
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml
     */
    async transactionsJSAPI(params: JSAPIPayParams): Promise<WxPayJSAPIResponse> {
        const pay = await this.ensurePay()
        const result = await pay.transactions_jsapi({
            ...params,
            notify_url: params.notify_url || this.config.notifyUrl,
        })
        return result
    }

    /**
     * Native 下单 (用于 PC 扫码支付)
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml
     */
    async transactionsNative(params: NativePayParams): Promise<{ code_url: string }> {
        const pay = await this.ensurePay()
        const result = await pay.transactions_native({
            ...params,
            notify_url: params.notify_url || this.config.notifyUrl,
        })
        return result
    }

    /**
     * 查询订单 (通过商户订单号)
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_2.shtml
     */
    async queryOrderByOutTradeNo(outTradeNo: string): Promise<PaymentResult> {
        const pay = await this.ensurePay()
        const result = await pay.query({ out_trade_no: outTradeNo })
        return result
    }

    /**
     * 查询订单 (通过微信订单号)
     */
    async queryOrderByTransactionId(transactionId: string): Promise<PaymentResult> {
        const pay = await this.ensurePay()
        const result = await pay.query({ transaction_id: transactionId })
        return result
    }

    /**
     * 关闭订单
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_3.shtml
     */
    async closeOrder(outTradeNo: string): Promise<void> {
        const pay = await this.ensurePay()
        await pay.close(outTradeNo)
    }

    /**
     * 解密支付通知 (AES-256-GCM)
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_5.shtml
     */
    async decryptNotification(notification: WeChatPayNotification): Promise<PaymentResult> {
        const pay = await this.ensurePay()
        const { ciphertext, associated_data, nonce } = notification.resource
        const result = pay.decipher_gcm(ciphertext, associated_data, nonce, this.config.key)
        return JSON.parse(result)
    }


    /**
     * 申请退款
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_9.shtml
     */
    async refund(params: {
        out_trade_no?: string
        transaction_id?: string
        out_refund_no: string
        reason?: string
        amount: {
            refund: number
            total: number
            currency?: string
        }
    }): Promise<any> {
        const pay = await this.ensurePay()
        return pay.refunds(params)
    }

    /**
     * 查询退款
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_10.shtml
     */
    async queryRefund(outRefundNo: string): Promise<any> {
        const pay = await this.ensurePay()
        return pay.find_refunds(outRefundNo)
    }

    /**
     * 验证微信支付回调签名
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_1.shtml
     */
    async verifySignature(params: {
        timestamp: string
        nonce: string
        body: string
        signature: string
        serial: string
    }): Promise<boolean> {
        const pay = await this.ensurePay()
        try {
            return pay.verifySign(params)
        } catch {
            return false
        }
    }
}

/**
 * 获取微信支付配置
 */
export async function getWeChatPayConfig(): Promise<WeChatPayConfig> {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')

    const appid = process.env.WECHAT_APP_ID
    const mchid = process.env.WECHAT_PAY_MCH_ID
    const key = process.env.WECHAT_PAY_API_V3_KEY
    const privateKeyPath = process.env.WECHAT_PAY_PRIVATE_KEY_PATH
    const publicKeyPath = process.env.WECHAT_PAY_PUBLIC_KEY_PATH
    const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL

    if (!appid || !mchid || !key || !privateKeyPath || !publicKeyPath || !notifyUrl) {
        throw new Error(
            'Missing WeChat Pay configuration. Required: WECHAT_APP_ID, WECHAT_PAY_MCH_ID, ' +
            'WECHAT_PAY_API_V3_KEY, WECHAT_PAY_PRIVATE_KEY_PATH, WECHAT_PAY_PUBLIC_KEY_PATH, WECHAT_PAY_NOTIFY_URL'
        )
    }

    let privateKey: Buffer
    let publicKey: Buffer

    try {
        privateKey = readFileSync(resolve(process.cwd(), privateKeyPath))
        publicKey = readFileSync(resolve(process.cwd(), publicKeyPath))
    } catch (error) {
        throw new Error(
            `Failed to read WeChat Pay certificates: ${error instanceof Error ? error.message : error}`
        )
    }

    return {
        appid,
        mchid,
        publicKey,
        privateKey,
        key,
        notifyUrl,
    }
}

/**
 * 获取微信支付客户端单例
 */
export async function getWeChatPayClient(): Promise<WeChatPayClient> {
    if (!wechatPayInstance) {
        const config = await getWeChatPayConfig()
        wechatPayInstance = new WeChatPayClient(config)
    }
    return wechatPayInstance
}

/**
 * 重置微信支付客户端（用于测试或配置更新）
 */
export function resetWeChatPayClient(): void {
    wechatPayInstance = null
}
