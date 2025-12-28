import { createFileRoute } from '@tanstack/react-router'
import { QuestionsPage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/questions' as any)({
  component: QuestionsPage,
})
