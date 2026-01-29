import { createFileRoute } from '@tanstack/react-router'
import { MobileHomePage } from '@/modules/mobile/features/home/homepage'

export const Route = createFileRoute('/m/')({
  component: MobileHomePage,
})
