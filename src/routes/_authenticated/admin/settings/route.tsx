import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsLayout } from '@/modules/admin/components/admin-settings-layout'

export const Route = createFileRoute('/_authenticated/admin/settings')({
  component: AdminSettingsLayout,
})
