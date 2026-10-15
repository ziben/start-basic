import { createFileRoute } from '@tanstack/react-router'
import { QuestionPaperPage } from '~/modules/question-bank/components/paper-editor'

export const Route = createFileRoute('/_authenticated/_app/question-bank/papers/$paperId')({
  component: Page,
})

function Page() {
  const { paperId } = Route.useParams()
  return <QuestionPaperPage paperId={paperId} />
}
