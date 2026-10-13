import { createFileRoute } from '@tanstack/react-router'
import { HealthReportComparisonPage } from '~/modules/health/features/comparison/health-report-comparison-page'

export const Route = createFileRoute('/_authenticated/_app/health/compare')({
  component: HealthReportComparisonPage,
})
