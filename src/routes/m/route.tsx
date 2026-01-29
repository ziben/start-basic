import { createFileRoute } from '@tanstack/react-router'
import { MobileLayout } from '@/modules/mobile/components/mobile-layout'

export const Route = createFileRoute('/m')({
  component: MobileLayout,
})

