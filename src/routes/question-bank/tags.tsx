import { createFileRoute } from '@tanstack/react-router'
import { TagsPage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/tags' as any)({
  component: TagsPage,
})
