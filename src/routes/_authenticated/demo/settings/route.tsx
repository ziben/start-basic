import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/modules/demo'

export const Route = createFileRoute('/_authenticated/demo/settings')({
  component: Settings,
})


