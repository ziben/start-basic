import { createFileRoute } from '@tanstack/react-router'
import { MobileLoginPage } from '@/modules/mobile/features/auth/login-page'

export const Route = createFileRoute('/m/login')({
  component: MobileLoginPage,
})
