import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from '@/shared/components/errors'

export const Route = createFileRoute('/(errors)/403')({
  component: ForbiddenError,
})




