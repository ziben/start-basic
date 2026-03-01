/**
 * Admin Account ServerFn - 账号信息聚合
 * [迁移自 admin/shared/server-fns/account.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { AccountService, type AdminAccountOverview } from '../services/account.service'

const GetAdminAccountSchema = z
  .object({
    userId: z.string().optional(),
  })
  .optional()

const SetAdminPasswordSchema = z.object({
  newPassword: z.string().min(1, 'newPassword 不能为空'),
  userId: z.string().optional(),
})

const UnlinkAdminAccountSchema = z.object({
  accountId: z.string().min(1, 'accountId 不能为空'),
  userId: z.string().optional(),
})

async function getRequestOrThrow(): Promise<Request> {
  const { getRequest } = await import('@tanstack/react-start/server')
  const request = getRequest()
  if (!request) {
    throw new Error('无法获取请求信息')
  }
  return request
}

export const getAdminAccountFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: z.infer<typeof GetAdminAccountSchema>) => GetAdminAccountSchema.parse(data))
  .handler(async ({ data }: { data?: z.infer<typeof GetAdminAccountSchema> }) => {
    await requireAdmin('GetAdminAccount')
    const request = await getRequestOrThrow()
    return (await AccountService.getOverview(request.headers, data?.userId)) satisfies AdminAccountOverview
  })

export const setAdminPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof SetAdminPasswordSchema>) => SetAdminPasswordSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof SetAdminPasswordSchema> }) => {
    await requireAdmin('SetAdminPassword')
    const request = await getRequestOrThrow()
    return AccountService.setPassword(request.headers, data.newPassword, data.userId)
  })

export const unlinkAdminAccountFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UnlinkAdminAccountSchema>) => UnlinkAdminAccountSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UnlinkAdminAccountSchema> }) => {
    await requireAdmin('UnlinkAdminAccount')
    const request = await getRequestOrThrow()
    return AccountService.unlinkAccount(request.headers, data.accountId, data.userId)
  })
