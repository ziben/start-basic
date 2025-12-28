import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/question-bank/' as any)({
  component: QuestionBankIndexPage,
})

function QuestionBankIndexPage() {
  return <div className="container py-6">Question Bank（占位）</div>
}
