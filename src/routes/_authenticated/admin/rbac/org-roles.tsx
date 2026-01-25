import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { OrgRolesPage } from '@/modules/admin/features/rbac'

const orgRolesSearchSchema = z.object({
  organizationId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/admin/rbac/org-roles')({
  validateSearch: (search) => orgRolesSearchSchema.parse(search),
  component: OrgRolesPage,
})
