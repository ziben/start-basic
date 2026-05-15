import { defineModule } from '~/core/module-registry'
import { NavGroupService } from './shared/navgroup/services/navgroup.service'
import { NavItemService } from './shared/navitem/services/navitem.service'

export const navigationModule = defineModule({
  key: 'navigation',
  version: '1.0.0',
  dependencies: ['auth'],
  exports: {
    services: {
      NavGroupService,
      NavItemService,
    },
  },
})

export type NavigationModule = typeof navigationModule
