import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/features/demo/settings'

export const Route = createFileRoute('/_authenticated/demo/settings')({
  component: Settings,
})
