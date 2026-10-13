import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '~/modules/auth/shared/lib/require-auth'

const CreateHealthPersonSchema = z.object({
  name: z.string().trim().min(1, '健康档案人员姓名不能为空').max(50),
  gender: z.string().trim().max(20).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期格式不正确')
    .optional(),
  relationLabel: z.string().trim().max(30).optional(),
  note: z.string().trim().max(500).optional(),
})

async function requireUserId(): Promise<string> {
  return (await requireUser()).id
}

export const listHealthPersonsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId()
  const { HealthPersonService } = await import('../services/health-person.service')
  return HealthPersonService.listForUser(userId)
})

export const createHealthPersonFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateHealthPersonSchema>) => CreateHealthPersonSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { HealthPersonService } = await import('../services/health-person.service')
    return HealthPersonService.createForUser(userId, data)
  })
