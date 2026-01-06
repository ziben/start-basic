import { createFileRoute } from '@tanstack/react-router'
import { UnauthorisedError } from '@/shared/components/errors'

export const Route = createFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})




