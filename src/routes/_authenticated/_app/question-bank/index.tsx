import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { QuestionBankPage } from '~/modules/question-bank/question-bank-page'

export const Route = createFileRoute('/_authenticated/_app/question-bank/')({
  validateSearch: z.object({
    view: z.enum(['mine', 'public', 'manage', 'import', 'papers']).catch('mine').default('mine'),
  }),
  component: Page,
})

function Page() {
  const { view } = Route.useSearch()
  return <QuestionBankPage view={view} />
}
