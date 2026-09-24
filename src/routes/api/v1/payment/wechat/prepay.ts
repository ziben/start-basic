import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/modules/auth/shared/lib/auth'
import { getWeChatOpenId } from '~/modules/auth/shared/services/account.service'
import { getWeChatPayClient } from '~/modules/payment/shared/lib/wechat-pay'
import { PrepayRequestSchema } from '~/modules/payment/shared/schemas/prepay'
import { createPrepayOrder } from '~/modules/payment/shared/services/create-prepay-order.service'
import { getDb } from '~/shared/lib/db'

export const Route = createFileRoute('/api/v1/payment/wechat/prepay')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const session = await auth.api.getSession({ headers: request.headers })

                    if (!session?.user) {
                        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    // 2. Parse and Validate Body
                    let bodyRaw: unknown
                    try {
                        bodyRaw = await request.json()
                    } catch {
                        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    const parsed = PrepayRequestSchema.safeParse(bodyRaw)
                    if (!parsed.success) {
                        return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    const prisma = await getDb()
                    const wechatPayClient = await getWeChatPayClient()
                    const result = await createPrepayOrder(parsed.data, {
                        sessionUserId: session.user.id,
                        notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
                        prisma,
                        getWeChatOpenId,
                        wechatPayClient,
                    })

                    return new Response(JSON.stringify(result), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    })
                } catch (error) {
                    console.error('[API prepay error]:', error)
                    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            },
        },
    },
})
