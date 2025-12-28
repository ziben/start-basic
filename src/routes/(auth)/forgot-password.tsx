import { createFileRoute } from '@tanstack/react-router'
import { ForgotPassword } from '~/modules/identity'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPassword,
})

