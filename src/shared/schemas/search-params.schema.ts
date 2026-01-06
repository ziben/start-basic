import { z } from 'zod'

/**
 * 通用的表格搜索参数 Schema
 */
export const tableSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type TableSearchParams = z.infer<typeof tableSearchSchema>
