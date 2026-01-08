import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Tasks, priorities, statuses } from '@/modules/demo'

const taskSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(statuses.map((status) => status.value)))
    .optional()
    .catch([]),
  priority: z
    .array(z.enum(priorities.map((priority) => priority.value)))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/_app/demo/tasks/')({
  validateSearch: taskSearchSchema,
  component: Tasks,
})




