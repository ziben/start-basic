import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/question-bank' as any)({
  beforeLoad: async ({ context }) => {
    if (!(context as any).user) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AuthenticatedLayout,
})

