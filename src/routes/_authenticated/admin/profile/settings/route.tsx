import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsLayout } from '@/modules/admin/components/admin-settings-layout'

export const Route = createFileRoute('/_authenticated/admin/profile/settings')({
  component: AdminSettingsLayout,
})
