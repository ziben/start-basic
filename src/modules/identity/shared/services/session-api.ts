import { z } from 'zod'
import { fetchJsonWithSchema } from '@/shared/lib/fetch-utils'

export type SessionInfo = {
  id: string
  userId: string
  username: string
  email: string
  loginTime: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export const sessionApi = {
  list: () => {
    const sessionInfoSchema = z.object({
      id: z.string(),
      userId: z.string(),
      username: z.string(),
      email: z.string(),
      loginTime: z.string(),
      expiresAt: z.string(),
      ipAddress: z.string(),
      userAgent: z.string(),
      isActive: z.boolean(),
    })
    const sessionsSchema = z.array(sessionInfoSchema)
    return fetchJsonWithSchema(sessionsSchema, '/api/sessions')
  },
} as const
