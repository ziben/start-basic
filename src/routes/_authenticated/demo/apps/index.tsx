import { Apps } from '@/features/demo/apps'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const appsSearchSchema = z.object({
  type: z
    .enum(['all', 'connected', 'notConnected'])
    .optional()
    .catch(undefined),
  filter: z.string().optional().catch(''),
  sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/demo/apps/')({
  validateSearch: appsSearchSchema,
  component: Apps,
})
