import { createFileRoute } from '@tanstack/react-router'
import { receiveBrowserMetric } from '~/infrastructure/observability/browser-metrics'

export const Route = createFileRoute('/api/metrics')({
  server: { handlers: { POST: ({ request }) => receiveBrowserMetric(request) } },
})
