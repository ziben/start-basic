import { createFileRoute } from '@tanstack/react-router'
import { MobileProfilePage } from '@/modules/mobile/features/profile/profile-page'

export const Route = createFileRoute('/m/profile')({
  component: MobileProfilePage,
})
