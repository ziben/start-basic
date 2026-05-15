import { defineModule } from '~/core/module-registry'
import { LogService } from './shared/services/log.service'
import { writeAuditLog, writeSystemLog } from './shared/services/server-log-writer'

export const auditModule = defineModule({
  key: 'audit',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      LogService,
      writeAuditLog,
      writeSystemLog,
    },
  },
})

export type AuditModule = typeof auditModule
