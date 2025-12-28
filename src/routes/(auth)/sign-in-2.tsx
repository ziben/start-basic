import { createFileRoute } from '@tanstack/react-router'
import { SignIn2 } from '~/modules/identity'

export const Route = createFileRoute('/(auth)/sign-in-2')({
  component: SignIn2,
})

