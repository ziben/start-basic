import { createFileRoute } from '@tanstack/react-router'
import { NewHealthReportPage } from '~/modules/health/features/reports/new-health-report-page'

export const Route = createFileRoute('/_authenticated/_app/health/reports/new')({
  component: NewHealthReportPage,
})
