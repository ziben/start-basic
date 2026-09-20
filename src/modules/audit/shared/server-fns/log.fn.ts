/**
 * Log ServerFn - 服务器函数层
 * [迁移自 admin/shared/server-fns/log.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
// ============ 认证辅助函数 ============

import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'

// ============ Schema 定义 ============

const ListLogsSchema = z.object({
  type: z.enum(['system', 'audit']).optional(),
  page: z.number().int().positive().max(100000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  filter: z.string().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  success: z.boolean().optional(),
  action: z.string().optional(),
  actorUserId: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

// ============ ServerFn 定义 ============

export const getLogsFn = createServerFn({ method: 'GET' })
  .validator(ListLogsSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListLogsSchema> }) => {
    await requireAdmin('ListLogs')
    const { LogService } = await import('../services/log.service')
    return LogService.getList(data)
  })
