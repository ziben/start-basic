import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'

const AssignRoleNavGroupsSchema = z.object({
  id: z.string().min(1),
  navGroupIds: z.array(z.string().min(1)),
})

export const assignRoleNavGroupsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof AssignRoleNavGroupsSchema>) => AssignRoleNavGroupsSchema.parse(data))
  .handler(async ({ data }: { data: z.infer<typeof AssignRoleNavGroupsSchema> }) => {
    const { handleAssignRoleNavGroups } = await import('../navgroup/services/role-nav-groups.service')
    return handleAssignRoleNavGroups({ data })
  })
