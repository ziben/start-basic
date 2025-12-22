import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import AdminUsers from '~/features/admin/users'

const userSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/admin/users')({
  validateSearch: userSearchSchema,
  component: AdminUsers,
})
