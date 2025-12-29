import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from '@/modules/demo'

export const Route = createFileRoute('/(errors)/403')({
  component: ForbiddenError,
})




