import { createFileRoute } from '@tanstack/react-router'
import { GeneralError } from '@/shared/components/errors'

export const Route = createFileRoute('/(errors)/500')({
  component: GeneralError,
})




