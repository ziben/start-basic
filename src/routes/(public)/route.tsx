import { PublicLayout } from '@/components/layout/public-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)')({
  component: PublicLayout,
})
