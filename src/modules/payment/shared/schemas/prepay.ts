import { z } from 'zod'

export const PrepayRequestSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(127),
  paymentMethod: z.enum(['WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5']),
  openid: z.string().optional(),
  attach: z.string().optional(),
})

export type PrepayRequestInput = z.infer<typeof PrepayRequestSchema>
