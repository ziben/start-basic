/**
 * Log ServerFn - 服务器函数层
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// ============ Schema 定义 ============

const ListLogsSchema = z.object({
    type: z.enum(['system', 'audit']).optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
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

// ============ 认证辅助函数 ============

import { requireAdmin } from './auth'

// ============ ServerFn 定义 ============

export const getLogsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListLogsSchema>) => (data ? ListLogsSchema.parse(data) : {}))
    .handler(async ({ data }: { data: z.infer<typeof ListLogsSchema> }) => {
        await requireAdmin('ListLogs')
        const { LogService } = await import('../services/log.service')
        return LogService.getList(data)
    })
