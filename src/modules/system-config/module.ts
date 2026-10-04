import { defineModule } from '~/core/module-registry'
import { RuntimeConfigService } from './services/runtime-config.service'

export const systemConfigModule = defineModule({
  key: 'system-config',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: { services: { RuntimeConfigService } },
})

export type SystemConfigModule = typeof systemConfigModule
