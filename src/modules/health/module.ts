import { defineModule } from '~/core/module-registry'
import { HealthReportService } from './shared/services/health-report.service'

export const healthModule = defineModule({
  key: 'health',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      HealthReportService,
    },
  },
})

export type HealthModule = typeof healthModule
