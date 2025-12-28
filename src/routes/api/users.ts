import { createFileRoute } from '@tanstack/react-router'
import type { User } from '@/shared/utils/users'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        console.info('Fetching users... @', request.url)
        // 由于无法直接访问上下文，暂时不进行权限检查
        // 在实际应用中，应通过其他方式验证用户身份
        const res = await fetch('https://jsonplaceholder.typicode.com/users')
        if (!res.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = (await res.json()) as Array<User>

        const list = data.slice(0, 10)

        return Response.json(list.map((u) => ({ id: u.id, name: u.name, email: u.email })))
      },
    },
  },
})
