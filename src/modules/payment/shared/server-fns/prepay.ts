import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { PrismaClient } from '~/generated/prisma/client'
import { PrepayRequestSchema } from '../schemas/prepay'
import { createPrepayOrder } from '../services/create-prepay-order.service'
import {
    type ClosePaymentOrderResult,
    type PaymentOrderStatusResult,
    type SyncPaymentOrderStatusResult,
    closePaymentOrder,
    queryPaymentOrderStatus,
    syncPaymentOrderStatus,
} from '../services/payment-order-status.service'

type PaymentRequestContext = {
    sessionUserId: string | null
    prisma: PrismaClient
}

function getRequiredNotifyUrl(): string {
    const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL

    if (!notifyUrl) {
        throw new Error('WECHAT_PAY_NOTIFY_URL is required')
    }

    return notifyUrl
}

function getServerRequestHeaders(getRequest: () => { headers: Headers } | undefined): Headers {
    const request = getRequest()

    if (!request) {
        throw new Error('Request context is unavailable')
    }

    return request.headers
}

export async function handleCreatePrepayOrder(
    data: z.infer<typeof PrepayRequestSchema>,
    headers: Headers,
): Promise<Awaited<ReturnType<typeof createPrepayOrder>>> {
    const { auth } = await import('../../../auth/shared/lib/auth')
    const { getDb } = await import('~/shared/lib/db')
    const { getWeChatPayClient } = await import('../lib/wechat-pay')

    const session = await auth.api.getSession({ headers })
    const prisma = await getDb()
    const wechatPayClient = await getWeChatPayClient()

    return createPrepayOrder(data, {
        sessionUserId: session?.user?.id ?? null,
        notifyUrl: getRequiredNotifyUrl(),
        prisma,
        wechatPayClient,
    })
}

export const createPrepayOrderFn = createServerFn({ method: 'POST' })
    .validator((data: unknown) => PrepayRequestSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof PrepayRequestSchema> }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const headers = getServerRequestHeaders(getRequest)
        return handleCreatePrepayOrder(data, headers)
    })

async function getPaymentRequestContext(headers: Headers): Promise<PaymentRequestContext> {
    const { auth } = await import('../../../auth/shared/lib/auth')
    const { getDb } = await import('~/shared/lib/db')

    const session = await auth.api.getSession({ headers })
    const prisma = await getDb()

    return {
        sessionUserId: session?.user?.id ?? null,
        prisma,
    }
}

export async function handleQueryOrderStatus(
    orderId: string,
    headers: Headers,
): Promise<PaymentOrderStatusResult> {
    const { sessionUserId, prisma } = await getPaymentRequestContext(headers)
    return queryPaymentOrderStatus({ orderId, sessionUserId, prisma })
}

export async function handleSyncOrderStatus(
    orderId: string,
    headers: Headers,
): Promise<SyncPaymentOrderStatusResult> {
    const { getWeChatPayClient } = await import('../lib/wechat-pay')
    const { onPaymentSuccess } = await import('./notify')
    const { sessionUserId, prisma } = await getPaymentRequestContext(headers)
    const wechatPayClient = await getWeChatPayClient()

    return syncPaymentOrderStatus({
        orderId,
        sessionUserId,
        prisma,
        wechatPayClient,
        onPaymentSuccess,
    })
}

export async function handleCloseOrder(
    orderId: string,
    headers: Headers,
): Promise<ClosePaymentOrderResult> {
    const { getWeChatPayClient } = await import('../lib/wechat-pay')
    const { sessionUserId, prisma } = await getPaymentRequestContext(headers)
    const wechatPayClient = await getWeChatPayClient()

    return closePaymentOrder({
        orderId,
        sessionUserId,
        prisma,
        wechatPayClient,
    })
}

/**
 * 查询订单状态
 */
export const queryOrderStatusFn = createServerFn({ method: 'GET' })
    .validator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const headers = getServerRequestHeaders(getRequest)
        return handleQueryOrderStatus(data.orderId, headers)
    })

/**
 * 主动查询微信支付订单状态 (用于客户端轮询)
 */
export const syncOrderStatusFn = createServerFn({ method: 'POST' })
    .validator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const headers = getServerRequestHeaders(getRequest)
        return handleSyncOrderStatus(data.orderId, headers)
    })

/**
 * 关闭订单 (取消支付)
 */
export const closeOrderFn = createServerFn({ method: 'POST' })
    .validator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
    .handler(async ({ data }: { data: { orderId: string } }) => {
        const { getRequest } = await import('@tanstack/react-start/server')
        const headers = getServerRequestHeaders(getRequest)
        return handleCloseOrder(data.orderId, headers)
    })
