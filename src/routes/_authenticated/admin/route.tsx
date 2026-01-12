import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/admin-layout'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async ({ context }) => {
    // 父路由 _authenticated 已经检查了登录状态
    // 这里只需要检查管理员权限
    const roleStr = context.user?.role || ''
    const roles = roleStr.split(',').map((r: string) => r.trim())

    const isAdmin = roles.includes('admin') || roles.includes('superadmin')

    if (!isAdmin) {
      throw redirect({ to: '/403' })
    }
  },
  component: AdminLayout,
})

