import { createFileRoute } from '@tanstack/react-router'
import { HealthReportsPage } from '~/modules/health/features/reports/health-reports-page'

export const Route = createFileRoute('/_authenticated/_app/health/reports')({
  component: HealthReportsPage,
})
