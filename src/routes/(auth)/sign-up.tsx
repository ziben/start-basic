import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '~/modules/auth'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUp,
  validateSearch: searchSchema,
})


