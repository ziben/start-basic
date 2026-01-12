import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '~/modules/demo/features/profile'

export const Route = createFileRoute('/_authenticated/demo/profile')({
  component: Profile,
})

