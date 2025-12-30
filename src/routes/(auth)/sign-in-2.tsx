import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SignIn2 } from '~/modules/identity'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in-2')({
  component: SignIn2,
  validateSearch: searchSchema,
})


