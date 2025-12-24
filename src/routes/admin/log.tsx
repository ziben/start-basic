import { createFileRoute } from '@tanstack/react-router'
import AdminLog from '~/features/admin/log'

export const Route = createFileRoute('/admin/log' as any)({
  component: AdminLog,
})
