import type { NextApiRequest, NextApiResponse } from 'next'
import { adminUsers } from '~/features/admin/user/data/mock'
import { adminUserListSchema } from '~/features/admin/user/data/schema'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 返回 mock 用户列表
    return res.status(200).json(adminUserListSchema.parse(adminUsers))
  }
  res.status(405).json({ message: 'Method Not Allowed' })
}
