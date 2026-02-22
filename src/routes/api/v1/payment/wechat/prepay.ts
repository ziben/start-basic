import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { auth } from '~/modules/auth/shared/lib/auth'
import { createPrepayOrderFn } from '~/modules/payment/shared/server-fns/prepay'

const PrepayRequestSchema = z.object({
    amount: z.number().int().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(127),
    paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5']),
    openid: z.string().optional(),
    attach: z.string().optional(),
})

export const Route = createFileRoute('/api/v1/payment/wechat/prepay')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    // 1. Authentication Check
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

                    const { amount, description, paymentMethod, openid, attach } = parsed.data

                    // 3. Call the existing prepay server function logic
                    // Server functions expect `data` as input
                    const result = await createPrepayOrderFn({
                        data: {
                            amount,
                            description,
                            paymentMethod,
                            openid,
                            attach
                        }
                    })

                    // 4. Return standard JSON response
                    return new Response(JSON.stringify(result), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    })
                } catch (error: any) {
                    console.error('[API prepay error]:', error)
                    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            },
        },
    },
})
