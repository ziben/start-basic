import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/profile/settings/$')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
})
