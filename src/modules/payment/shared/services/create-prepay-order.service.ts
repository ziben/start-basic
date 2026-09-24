import { ServiceError } from '~/shared/utils/service-error'
import type { PrepayRequestInput } from '../schemas/prepay'

type JsapiPayload = {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType?: 'RSA'
  paySign: string
}

type PaymentOrderPrisma = {
  paymentOrder: {
    create(args: {
      data: {
        userId: string
        outTradeNo: string
        amount: number
        description: string
        paymentMethod: PrepayRequestInput['paymentMethod']
        status: 'PENDING' | 'FAILED'
        metadata?: { attach: string }
      }
    }): Promise<{ id: string }>
    update(args: { where: { id: string }; data: { status: 'FAILED' } }): Promise<unknown>
  }
}

type WeChatPayGateway = {
  transactionsNative(params: {
    description: string
    out_trade_no: string
    notify_url: string
    amount: { total: number; currency: 'CNY' }
    attach?: string
  }): Promise<{ code_url: string }>
  transactionsJSAPI(params: {
    description: string
    out_trade_no: string
    notify_url: string
    amount: { total: number; currency: 'CNY' }
    payer: { openid: string }
    attach?: string
  }): Promise<JsapiPayload | { data: JsapiPayload }>
}

type CreatePrepayOrderDeps = {
  sessionUserId: string | null
  notifyUrl: string
  prisma: PaymentOrderPrisma
  getWeChatOpenId: (userId: string) => Promise<string | null>
  wechatPayClient: WeChatPayGateway
  createOutTradeNo?: () => string
}

function defaultOutTradeNo(): string {
  return `${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

function normalizeJsapiPayload(result: JsapiPayload | { data: JsapiPayload }): JsapiPayload {
  return 'data' in result ? result.data : result
}

export async function createPrepayOrder(input: PrepayRequestInput, deps: CreatePrepayOrderDeps) {
  if (!deps.sessionUserId) {
    throw new ServiceError('UNAUTHORIZED', 'Unauthorized')
  }

  const outTradeNo = deps.createOutTradeNo?.() ?? defaultOutTradeNo()
  const order = await deps.prisma.paymentOrder.create({
    data: {
      userId: deps.sessionUserId,
      outTradeNo,
      amount: input.amount,
      description: input.description,
      paymentMethod: input.paymentMethod,
      status: 'PENDING',
      metadata: input.attach ? { attach: input.attach } : undefined,
    },
  })

  try {
    if (input.paymentMethod === 'WECHAT_NATIVE') {
      const result = await deps.wechatPayClient.transactionsNative({
        description: input.description,
        out_trade_no: outTradeNo,
        notify_url: deps.notifyUrl,
        amount: { total: input.amount, currency: 'CNY' },
        attach: input.attach,
      })

      return {
        orderId: order.id,
        outTradeNo,
        codeUrl: result.code_url,
      }
    }

    let openid = input.openid
    if (!openid) {
      openid = (await deps.getWeChatOpenId(deps.sessionUserId)) ?? undefined
    }

    if (!openid) {
      throw new Error('openid is required for JSAPI payment')
    }

    const result = await deps.wechatPayClient.transactionsJSAPI({
      description: input.description,
      out_trade_no: outTradeNo,
      notify_url: deps.notifyUrl,
      amount: { total: input.amount, currency: 'CNY' },
      payer: { openid },
      attach: input.attach,
    })

    const jsapiData = normalizeJsapiPayload(result)
    return {
      orderId: order.id,
      outTradeNo,
      prepayId: jsapiData.package?.replace('prepay_id=', ''),
      jsapiParams: {
        appId: jsapiData.appId,
        timeStamp: jsapiData.timeStamp,
        nonceStr: jsapiData.nonceStr,
        package: jsapiData.package,
        signType: jsapiData.signType ?? 'RSA',
        paySign: jsapiData.paySign,
      },
    }
  } catch (error) {
    await deps.prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    })

    throw new Error(`Payment request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
