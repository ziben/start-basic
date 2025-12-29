import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '~/modules/identity'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUp,
})


