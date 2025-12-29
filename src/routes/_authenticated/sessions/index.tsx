import { createFileRoute } from '@tanstack/react-router'
import { Sessions } from '~/modules/identity'

export const Route = createFileRoute('/_authenticated/sessions/')({
  component: Sessions,
})


