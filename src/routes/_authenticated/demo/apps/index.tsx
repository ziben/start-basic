import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Apps } from '@/modules/demo'

const appsSearchSchema = z.object({
  type: z.enum(['all', 'connected', 'notConnected']).optional().catch(undefined),
  filter: z.string().optional().catch(''),
  sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/demo/apps/')({
  validateSearch: appsSearchSchema,
  component: Apps,
})



