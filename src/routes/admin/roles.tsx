import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AdminRoles } from '~/modules/system-admin/features/identity/roles'

const roleSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/admin/roles')({
  validateSearch: roleSearchSchema,
  component: AdminRoles,
})
