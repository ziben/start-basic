import { createFileRoute } from '@tanstack/react-router'
import { AdminLog } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/log' as any)({
  component: AdminLog,
})


