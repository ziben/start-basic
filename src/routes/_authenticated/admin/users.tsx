import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import AdminUsers from '~/features/admin/users'

const userSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/admin/users')({
  validateSearch: userSearchSchema,
  component: AdminUsers,
}) 