import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/admin-layout'

export const Route = createFileRoute('/_authenticated/demo')({
  component: AdminLayout,
})

