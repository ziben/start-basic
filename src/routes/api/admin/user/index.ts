import { createFileRoute } from '@tanstack/react-router'
import { adminUsers } from '~/features/admin/users/data/mock'
import { adminUsersListSchema } from '~/features/admin/users/data/schema'

export const Route = createFileRoute('/api/admin/user/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // 返回 mock 用户列表
        return Response.json(adminUsersListSchema.parse(adminUsers))
      },
    }
  }
})
