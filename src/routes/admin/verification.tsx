import { createFileRoute } from '@tanstack/react-router'
import { AdminVerification } from '~/modules/system-admin'

export const Route = createFileRoute('/admin/verification')({
  component: AdminVerification,
})

