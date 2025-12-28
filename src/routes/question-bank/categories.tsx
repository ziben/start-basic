import { createFileRoute } from '@tanstack/react-router'
import { CategoriesPage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/categories' as any)({
  component: CategoriesPage,
})
