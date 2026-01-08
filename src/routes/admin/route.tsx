import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/admin-layout'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context, location }) => {
    // 检查用户是否登录
    if (!context.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }

    // 检查用户是否有管理员权限
    const role = context.user.role
    const systemRoleName = (context.user as any)?.systemRole?.name

    if (role !== 'admin' && role !== 'superadmin' && systemRoleName !== 'admin') {
      throw redirect({ to: '/403' })
    }
  },
  component: AdminLayout,
})

