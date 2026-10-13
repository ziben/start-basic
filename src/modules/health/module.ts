import { defineModule } from '~/core/module-registry'
import { HealthPersonService } from './shared/services/health-person.service'
import { HealthReportService } from './shared/services/health-report.service'

export const healthModule = defineModule({
  key: 'health',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      HealthPersonService,
      HealthReportService,
    },
  },
})

export type HealthModule = typeof healthModule
