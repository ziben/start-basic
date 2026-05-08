import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { HealthReportDetailPage } from '~/modules/health/features/reports/health-report-detail-page'

export const Route = createFileRoute('/_authenticated/_app/health/reports/$reportId')({
  component: RouteComponent,
})

function RouteComponent(): ReactElement {
  const { reportId } = Route.useParams()
  return <HealthReportDetailPage reportId={reportId} />
}
