import { defineModule } from '~/core/module-registry'

export const identityModule = defineModule({
  key: 'identity',
  version: '1.0.0',
  dependencies: ['auth'],
})

export type IdentityModule = typeof identityModule
