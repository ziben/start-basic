import { createFileRoute } from '@tanstack/react-router'
import { AdminSession } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/session')({
  component: AdminSession,
})

