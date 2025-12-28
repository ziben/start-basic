import { createFileRoute } from '@tanstack/react-router'
import { ImportExportPage } from '~/modules/question-bank'

export const Route = createFileRoute('/question-bank/import-export' as any)({
  component: ImportExportPage,
})
