/**
 * Admin Account ServerFn - 账号信息聚合
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'
import { AccountService, type AdminAccountOverview } from '../services/account.service'

const SetAdminPasswordSchema = z.object({
  newPassword: z.string().min(1, 'newPassword 不能为空'),
})

const UnlinkAdminAccountSchema = z.object({
  accountId: z.string().min(1, 'accountId 不能为空'),
})

async function getRequestOrThrow(): Promise<Request> {
  const { getRequest } = await import('@tanstack/react-start/server')
  const request = getRequest()
  if (!request) {
    throw new Error('无法获取请求信息')
  }
  return request
}

export const getAdminAccountFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin('GetAdminAccount')
  const request = await getRequestOrThrow()
  return (await AccountService.getOverview(request.headers)) satisfies AdminAccountOverview
})

export const setAdminPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof SetAdminPasswordSchema>) => SetAdminPasswordSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof SetAdminPasswordSchema> }) => {
    await requireAdmin('SetAdminPassword')
    const request = await getRequestOrThrow()
    return AccountService.setPassword(request.headers, data.newPassword)
  })

export const unlinkAdminAccountFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UnlinkAdminAccountSchema>) => UnlinkAdminAccountSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UnlinkAdminAccountSchema> }) => {
    await requireAdmin('UnlinkAdminAccount')
    const request = await getRequestOrThrow()
    return AccountService.unlinkAccount(request.headers, data.accountId)
  })
