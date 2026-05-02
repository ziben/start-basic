import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AdminNavigationPage } from '~/modules/admin'

const navigationSearchSchema = z.object({
  tab: z.enum(['groups', 'items']).optional().catch('groups'),
  navGroupId: z.string().optional().catch(undefined),
  filter: z.string().optional().catch(undefined),
  title: z.string().optional().catch(undefined),
  description: z.string().optional().catch(undefined),
  page: z.coerce.number().optional().catch(undefined),
  pageSize: z.coerce.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/admin/navigation')({
  component: AdminNavigationPage,
  validateSearch: navigationSearchSchema,
})



