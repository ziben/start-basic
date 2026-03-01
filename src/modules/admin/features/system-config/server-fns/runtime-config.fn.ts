/**
 * Runtime Config ServerFn
 * [迁移自 admin/shared/server-fns/runtime-config.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { auth } from '~/modules/auth/shared/lib/auth'

const CreateRuntimeConfigSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9][a-z0-9._-]*$/, 'key 只允许小写字母、数字、点、横线、下划线，且不能以点或横线开头'),
  value: z.string(),
  category: z.string().min(1),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'STRING_ARRAY']),
  isSecret: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  description: z.string().nullable().optional(),
})

const UpdateRuntimeConfigSchema = z.object({
  id: z.string().min(1),
  value: z.string(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'STRING_ARRAY']).optional(),
  isEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  description: z.string().nullable().optional(),
  note: z.string().optional(),
})

const RuntimeConfigHistorySchema = z.object({
  configId: z.string().min(1),
  take: z.number().int().min(1).max(200).optional(),
})

const DeleteRuntimeConfigSchema = z.object({
  id: z.string().min(1),
})

async function getOperator(): Promise<{ operatorId: string | null; operatorName: string | null }> {
  const request = getRequest()
  if (!request) return { operatorId: null, operatorName: null }
  const session = await auth.api.getSession({ headers: request.headers })
  return {
    operatorId: session?.user?.id ?? null,
    operatorName: session?.user?.name ?? null,
  }
}

export const listRuntimeConfigsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin('ListRuntimeConfigs')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    return RuntimeConfigService.list()
  })

export const getPublicRuntimeConfigsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Unauthenticated access for public configurations (e.g. login_title)
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    return RuntimeConfigService.listPublic()
  })

export const createRuntimeConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateRuntimeConfigSchema>) => CreateRuntimeConfigSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof CreateRuntimeConfigSchema> }) => {
    await requireAdmin('CreateRuntimeConfig')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    const operator = await getOperator()
    return RuntimeConfigService.create({ ...data, ...operator })
  })

export const updateRuntimeConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateRuntimeConfigSchema>) => UpdateRuntimeConfigSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof UpdateRuntimeConfigSchema> }) => {
    await requireAdmin('UpdateRuntimeConfig')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    const operator = await getOperator()
    return RuntimeConfigService.update({ ...data, ...operator })
  })

export const getRuntimeConfigHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RuntimeConfigHistorySchema>) => RuntimeConfigHistorySchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof RuntimeConfigHistorySchema> }) => {
    await requireAdmin('GetRuntimeConfigHistory')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    return RuntimeConfigService.listChanges(data.configId, data.take ?? 50)
  })

export const deleteRuntimeConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteRuntimeConfigSchema>) => DeleteRuntimeConfigSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof DeleteRuntimeConfigSchema> }) => {
    await requireAdmin('DeleteRuntimeConfig')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    const operator = await getOperator()
    await RuntimeConfigService.delete({ ...data, ...operator })
    return { success: true }
  })

export const refreshRuntimeConfigFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    await requireAdmin('RefreshRuntimeConfig')
    const { RuntimeConfigService } = await import('../services/runtime-config.service')
    const operator = await getOperator()
    const { refreshedAt } = await RuntimeConfigService.refresh(operator.operatorId, operator.operatorName)
    return {
      success: true,
      refreshedAt,
    }
  })
