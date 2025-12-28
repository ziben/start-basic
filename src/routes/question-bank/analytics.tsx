import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/analytics' as any)({
  component: AnalyticsPage,
})
