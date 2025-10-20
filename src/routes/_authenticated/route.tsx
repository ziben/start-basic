import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AuthenticatedLayout,
})
