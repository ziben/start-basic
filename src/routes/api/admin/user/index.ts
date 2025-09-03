import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { adminUsers } from '~/features/admin/users/data/mock'
import { adminUsersListSchema } from '~/features/admin/users/data/schema'

export const ServerRoute = createServerFileRoute('/api/admin/user/').methods({
  GET: async ({ request }) => {
    // 返回 mock 用户列表
    return json(adminUsersListSchema.parse(adminUsers))
  },
})
