import { createFileRoute } from '@tanstack/react-router'
import { NotFoundError } from '@/modules/demo'

export const Route = createFileRoute('/(errors)/404')({
  component: NotFoundError,
})




