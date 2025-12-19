import { AdminLayout } from '@/components/layout/admin-layout'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // 检查用户是否登录
    if (!context.user) {
      throw redirect({ to: '/sign-in' })
    }
    
    // TODO: 检查用户是否有管理员权限
    // if (context.user.role !== 'admin') {
    //   throw redirect({ to: '/403' })
    // }
  },
  component: AdminLayout,
})
