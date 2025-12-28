import { createFileRoute } from '@tanstack/react-router'
import { PracticePage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/practice' as any)({
  component: PracticePage,
})

