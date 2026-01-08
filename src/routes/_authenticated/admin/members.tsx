import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { tableSearchSchema } from '@/shared/schemas/search-params.schema'
import { MembersPage } from '~/modules/system-admin'

const membersSearchSchema = tableSearchSchema.extend({
  organizationId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/admin/members')({
  validateSearch: membersSearchSchema,
  component: MembersPage,
})

